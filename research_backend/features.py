from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, Field

import main

router = APIRouter()
COOKIE_NAME = "edubot_session"


def oid(value):
    try:
        return ObjectId(str(value))
    except Exception:
        return None


def now():
    return datetime.now(timezone.utc)


def db():
    return main.client[main.DB_NAME]


def users_col():
    return db()[main.env_value("MONGODB_USER_COLLECTION", "users")]


def conversations_col():
    return db()[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")]


def messages_col():
    return db()[main.env_value("MONGODB_MESSAGE_COLLECTION", "messages")]


def feedback_col():
    return db()[main.env_value("MONGODB_FEEDBACK_COLLECTION", "feedbacks")]


def public_user(user):
    return {
        "id": str(user["_id"]),
        "name": user.get("name", "Student"),
        "email": user.get("email", ""),
        "role": user.get("role", "student"),
        "avatar": user.get("avatar", ""),
    }


def token_for(user_id):
    secret = main.env_value("JWT_SECRET", "")
    if len(secret) < 32:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured correctly")
    return jwt.encode({"userId": str(user_id), "exp": now() + timedelta(days=7)}, secret, algorithm="HS256")


def current_user(edubot_session: Optional[str] = Cookie(default=None)):
    if not edubot_session:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(edubot_session, main.env_value("JWT_SECRET", ""), algorithms=["HS256"])
        user_id = oid(payload.get("userId"))
        if not user_id:
            raise ValueError("invalid user")
        user = users_col().find_one({"_id": user_id, "isActive": {"$ne": False}})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired")


def admin_user(user=Depends(current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    email: str = Field(min_length=5, max_length=160)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str
    password: str


class AppChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    conversationId: Optional[str] = None
    subjectId: Optional[str] = None


class FeedbackRequest(BaseModel):
    messageId: str
    rating: int = Field(ge=1, le=5)
    helpful: bool
    comment: str = Field(default="", max_length=500)


class SubjectRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    description: str = Field(default="", max_length=500)
    icon: str = Field(default="📚", max_length=10)


class KnowledgeRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    question: str = Field(default="", max_length=1000)
    answer: str = Field(min_length=2, max_length=10000)
    topic: str = Field(default="", max_length=200)
    keywords: list[str] = Field(default_factory=list)
    difficulty: str = Field(default="beginner", max_length=30)
    source: str = Field(default="EduBot Knowledge Base", max_length=300)
    subjectId: Optional[str] = None


@router.post("/auth/register")
def register(request: RegisterRequest, response: Response):
    email = request.email.strip().lower()
    if users_col().find_one({"email": email}):
        raise HTTPException(status_code=409, detail="User with this email already exists")
    stamp = now()
    user = {
        "name": request.name.strip(), "email": email,
        "password": bcrypt.hashpw(request.password.encode(), bcrypt.gensalt(12)).decode(),
        "role": "student", "avatar": "", "isActive": True,
        "createdAt": stamp, "updatedAt": stamp,
    }
    result = users_col().insert_one(user)
    user["_id"] = result.inserted_id
    response.set_cookie(COOKIE_NAME, token_for(result.inserted_id), httponly=True, secure=True,
                        samesite="none", max_age=7 * 24 * 3600, path="/")
    return {"success": True, "message": "Registration successful", "user": public_user(user)}


@router.post("/auth/login")
def login(request: LoginRequest, response: Response):
    user = users_col().find_one({"email": request.email.strip().lower()})
    valid = False
    if user and user.get("isActive") is not False:
        try:
            valid = bcrypt.checkpw(request.password.encode(), user.get("password", "").encode())
        except Exception:
            valid = False
    if not valid:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    response.set_cookie(COOKIE_NAME, token_for(user["_id"]), httponly=True, secure=True,
                        samesite="none", max_age=7 * 24 * 3600, path="/")
    return {"success": True, "message": "Login successful", "user": public_user(user)}


@router.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie(COOKIE_NAME, path="/")
    return {"success": True, "message": "Logout successful"}


@router.get("/auth/me")
def me(user=Depends(current_user)):
    return {"success": True, "user": public_user(user)}


@router.get("/subjects")
def subjects():
    items = list(db()[main.SUBJECT_COLLECTION].find({"isActive": {"$ne": False}}, {"name": 1, "icon": 1, "description": 1}).sort("name", 1))
    return {"success": True, "subjects": [{"_id": str(x["_id"]), "name": x.get("name", ""), "icon": x.get("icon", "📚"), "description": x.get("description", "")} for x in items]}


@router.post("/chat")
def app_chat(request: AppChatRequest, user=Depends(current_user)):
    if main.embedding_model is None or main.index is None:
        raise HTTPException(status_code=503, detail="EduBot AI is still initializing. Please try again shortly.")
    conversations = conversations_col()
    subject = None
    if request.subjectId:
        sid = oid(request.subjectId)
        if sid:
            subject = db()[main.SUBJECT_COLLECTION].find_one({"_id": sid, "isActive": {"$ne": False}})
    conversation = None
    if request.conversationId:
        cid = oid(request.conversationId)
        if cid:
            conversation = conversations.find_one({"_id": cid, "user": user["_id"], "isActive": True})
    stamp = now()
    if not conversation:
        conversation = {"user": user["_id"], "subject": subject["_id"] if subject else None,
                        "title": request.message.strip()[:80] or "New Conversation", "lastMessageAt": stamp,
                        "isActive": True, "createdAt": stamp, "updatedAt": stamp}
        conversation["_id"] = conversations.insert_one(conversation).inserted_id
    elif subject and not conversation.get("subject"):
        conversations.update_one({"_id": conversation["_id"]}, {"$set": {"subject": subject["_id"], "updatedAt": stamp}})
        conversation["subject"] = subject["_id"]

    user_message = {"conversation": conversation["_id"], "sender": "user", "content": request.message.strip(),
                    "subject": subject["_id"] if subject else conversation.get("subject"), "createdAt": stamp, "updatedAt": stamp}
    user_message["_id"] = messages_col().insert_one(user_message).inserted_id
    contexts = main.retrieve(request.message.strip(), subject.get("name") if subject else None)
    answer = main.generate_answer(request.message.strip(), contexts)
    best = contexts[0] if contexts else None
    bot_message = {"conversation": conversation["_id"], "sender": "bot", "content": answer, "intent": "general",
                   "subject": subject["_id"] if subject else conversation.get("subject"),
                   "sourceKnowledge": oid(best.get("id")) if best and best.get("id") else None,
                   "retrievalScore": best["score"] if best else 0, "createdAt": stamp, "updatedAt": stamp}
    bot_message["_id"] = messages_col().insert_one(bot_message).inserted_id
    conversations.update_one({"_id": conversation["_id"]}, {"$set": {"lastMessageAt": stamp, "updatedAt": stamp}})
    subject_public = {"_id": str(subject["_id"]), "name": subject.get("name"), "icon": subject.get("icon", "📚")} if subject else None
    return {"success": True, "message": answer,
            "conversation": {"id": str(conversation["_id"]), "title": conversation.get("title"), "subject": subject_public},
            "messageData": {"user": {"_id": str(user_message["_id"])}, "bot": {"_id": str(bot_message["_id"]), "retrievalScore": bot_message["retrievalScore"]}},
            "analysis": {"retrievalScore": best["score"] if best else 0, "source": best["title"] if best else None},
            "sources": contexts, "grounded": bool(contexts)}


@router.get("/chat/history")
def history(user=Depends(current_user)):
    items = list(conversations_col().find({"user": user["_id"], "isActive": True}).sort("lastMessageAt", -1).limit(50))
    result = []
    for item in items:
        subject = db()[main.SUBJECT_COLLECTION].find_one({"_id": item.get("subject")}, {"name": 1, "icon": 1}) if item.get("subject") else None
        result.append({"_id": str(item["_id"]), "title": item.get("title", "New Conversation"),
                       "subject": {"_id": str(subject["_id"]), "name": subject.get("name"), "icon": subject.get("icon", "📚")} if subject else None,
                       "lastMessageAt": item.get("lastMessageAt")})
    return {"success": True, "count": len(result), "conversations": result}


@router.get("/chat/{conversation_id}")
def conversation(conversation_id: str, user=Depends(current_user)):
    cid = oid(conversation_id)
    if not cid:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    item = conversations_col().find_one({"_id": cid, "user": user["_id"], "isActive": True})
    if not item:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = list(messages_col().find({"conversation": cid}).sort("createdAt", 1))
    subject = db()[main.SUBJECT_COLLECTION].find_one({"_id": item.get("subject")}, {"name": 1, "icon": 1}) if item.get("subject") else None
    return {"success": True, "conversation": {"_id": str(cid), "title": item.get("title"), "subject": {"_id": str(subject["_id"]), "name": subject.get("name"), "icon": subject.get("icon", "📚")} if subject else None},
            "messages": [{"_id": str(m["_id"]), "content": m.get("content", ""), "sender": m.get("sender", "bot"), "retrievalScore": m.get("retrievalScore", 0)} for m in messages]}


@router.delete("/chat/{conversation_id}")
def delete_conversation(conversation_id: str, user=Depends(current_user)):
    cid = oid(conversation_id)
    if not cid:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    result = conversations_col().update_one({"_id": cid, "user": user["_id"]}, {"$set": {"isActive": False, "updatedAt": now()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True, "message": "Conversation deleted"}


@router.post("/feedback")
def feedback(request: FeedbackRequest, user=Depends(current_user)):
    mid = oid(request.messageId)
    if not mid:
        raise HTTPException(status_code=400, detail="Invalid message ID")
    message = messages_col().find_one({"_id": mid, "sender": "bot"})
    if not message:
        raise HTTPException(status_code=404, detail="Bot message not found")
    conversation = conversations_col().find_one({"_id": message["conversation"], "user": user["_id"]})
    if not conversation:
        raise HTTPException(status_code=403, detail="Not your message")
    stamp = now()
    feedback_col().update_one({"message": mid, "user": user["_id"]},
        {"$set": {"message": mid, "user": user["_id"], "conversation": message["conversation"], "rating": request.rating,
                  "helpful": request.helpful, "comment": request.comment, "updatedAt": stamp}, "$setOnInsert": {"createdAt": stamp}}, upsert=True)
    return {"success": True, "message": "Thanks for your feedback"}


@router.get("/feedback/mine")
def feedback_mine(user=Depends(current_user)):
    items = list(feedback_col().find({"user": user["_id"]}).sort("createdAt", -1).limit(100))
    return {"success": True, "feedback": [{"messageId": str(x.get("message")), "rating": x.get("rating", 0), "helpful": x.get("helpful", False), "comment": x.get("comment", "")} for x in items]}


@router.get("/dashboard")
def dashboard(user=Depends(current_user)):
    conversations = list(conversations_col().find({"user": user["_id"], "isActive": True}).sort("lastMessageAt", -1))
    ids = [x["_id"] for x in conversations]
    questions = messages_col().count_documents({"conversation": {"$in": ids}, "sender": "user"}) if ids else 0
    bots = messages_col().count_documents({"conversation": {"$in": ids}, "sender": "bot"}) if ids else 0
    feedback_items = list(feedback_col().find({"user": user["_id"]}, {"rating": 1, "helpful": 1}))
    avg = round(sum(float(x.get("rating", 0)) for x in feedback_items) / len(feedback_items), 2) if feedback_items else 0
    subject_ids = {str(x.get("subject")) for x in conversations if x.get("subject")}
    return {"success": True, "stats": {"conversations": len(conversations), "questions": questions, "botResponses": bots,
        "averageRating": avg, "helpfulAnswers": sum(1 for x in feedback_items if x.get("helpful")), "subjectsStudied": len(subject_ids)},
        "subjects": [{"name": x.get("name"), "icon": x.get("icon", "📚")} for x in db()[main.SUBJECT_COLLECTION].find({"_id": {"$in": [oid(x) for x in subject_ids if oid(x)]}, "isActive": {"$ne": False}}, {"name": 1, "icon": 1})],
        "recentConversations": [{"_id": str(x["_id"]), "title": x.get("title", "New Conversation"), "lastMessageAt": x.get("lastMessageAt")} for x in conversations[:10]]}


@router.get("/admin/dashboard")
def admin_dashboard(user=Depends(admin_user)):
    stats = {
        "totalUsers": users_col().count_documents({}),
        "totalSubjects": db()[main.SUBJECT_COLLECTION].count_documents({"isActive": {"$ne": False}}),
        "totalKnowledge": db()[main.KNOWLEDGE_COLLECTION].count_documents({"isActive": {"$ne": False}}),
        "totalConversations": conversations_col().count_documents({"isActive": {"$ne": False}}),
    }
    ratings = list(feedback_col().find({}, {"rating": 1}))
    stats["averageRating"] = round(sum(float(x.get("rating", 0)) for x in ratings) / len(ratings), 2) if ratings else 0
    return {"success": True, "stats": {"users": stats["totalUsers"], "students": users_col().count_documents({"role": "student"}),
        "conversations": stats["totalConversations"], "knowledge": stats["totalKnowledge"], "feedback": len(ratings), **stats}}


@router.get("/admin/users")
def admin_users(user=Depends(admin_user)):
    items = list(users_col().find({}, {"password": 0}).sort("createdAt", -1).limit(200))
    return {"success": True, "users": [{**public_user(x), "isActive": x.get("isActive", True), "createdAt": x.get("createdAt")} for x in items]}


@router.patch("/admin/users/{user_id}/status")
def admin_status(user_id: str, active: bool, user=Depends(admin_user)):
    uid = oid(user_id)
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    if uid == user["_id"] and not active:
        raise HTTPException(status_code=400, detail="You cannot disable your own admin account")
    result = users_col().update_one({"_id": uid}, {"$set": {"isActive": active, "updatedAt": now()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "message": "User status updated"}


@router.post("/admin/subjects")
def admin_subject(request: SubjectRequest, user=Depends(admin_user)):
    stamp = now()
    result = db()[main.SUBJECT_COLLECTION].insert_one({"name": request.name.strip(), "description": request.description.strip(),
        "icon": request.icon or "📚", "isActive": True, "createdAt": stamp, "updatedAt": stamp})
    main.load_subjects()
    return {"success": True, "message": "Subject added successfully", "id": str(result.inserted_id)}


@router.patch("/admin/subjects/{subject_id}")
def update_subject(subject_id: str, request: SubjectRequest, user=Depends(admin_user)):
    sid = oid(subject_id)
    if not sid:
        raise HTTPException(status_code=400, detail="Invalid subject ID")
    result = db()[main.SUBJECT_COLLECTION].update_one({"_id": sid}, {"$set": {"name": request.name.strip(), "description": request.description.strip(), "icon": request.icon or "📚", "updatedAt": now()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Subject not found")
    main.load_subjects()
    return {"success": True, "message": "Subject updated successfully"}


@router.delete("/admin/subjects/{subject_id}")
def delete_subject(subject_id: str, user=Depends(admin_user)):
    sid = oid(subject_id)
    if not sid:
        raise HTTPException(status_code=400, detail="Invalid subject ID")
    result = db()[main.SUBJECT_COLLECTION].update_one({"_id": sid}, {"$set": {"isActive": False, "updatedAt": now()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Subject not found")
    main.load_subjects()
    return {"success": True, "message": "Subject deactivated successfully"}


def knowledge_public(item):
    subject = None
    sid = item.get("subject")
    if sid:
        subject = db()[main.SUBJECT_COLLECTION].find_one({"_id": sid}, {"name": 1, "icon": 1})
    return {"_id": str(item["_id"]), "title": item.get("title", ""), "question": item.get("question", ""),
            "answer": item.get("answer", ""), "topic": item.get("topic", ""), "keywords": item.get("keywords", []),
            "difficulty": item.get("difficulty", "beginner"), "source": item.get("source", "EduBot Knowledge Base"),
            "subject": {"_id": str(subject["_id"]), "name": subject.get("name", ""), "icon": subject.get("icon", "📚")} if subject else None}


@router.get("/admin/knowledge")
def admin_knowledge_list(user=Depends(admin_user)):
    items = list(db()[main.KNOWLEDGE_COLLECTION].find({"isActive": {"$ne": False}}).sort("updatedAt", -1).limit(500))
    return {"success": True, "knowledge": [knowledge_public(x) for x in items]}


@router.post("/admin/knowledge")
def admin_knowledge(request: KnowledgeRequest, user=Depends(admin_user)):
    sid = oid(request.subjectId) if request.subjectId else None
    if request.subjectId and not sid:
        raise HTTPException(status_code=400, detail="Invalid subject ID")
    if sid and not db()[main.SUBJECT_COLLECTION].find_one({"_id": sid, "isActive": {"$ne": False}}):
        raise HTTPException(status_code=404, detail="Subject not found")
    stamp = now()
    result = db()[main.KNOWLEDGE_COLLECTION].insert_one({"title": request.title.strip(), "question": request.question.strip(),
        "answer": request.answer.strip(), "topic": request.topic.strip(), "keywords": request.keywords,
        "difficulty": request.difficulty.strip() or "beginner", "source": request.source.strip() or "EduBot Knowledge Base",
        "subject": sid, "isActive": True, "createdAt": stamp, "updatedAt": stamp})
    main.load_knowledge()
    return {"success": True, "message": "Knowledge added successfully", "id": str(result.inserted_id)}


@router.patch("/admin/knowledge/{knowledge_id}")
def update_knowledge(knowledge_id: str, request: KnowledgeRequest, user=Depends(admin_user)):
    kid = oid(knowledge_id)
    if not kid:
        raise HTTPException(status_code=400, detail="Invalid knowledge ID")
    sid = oid(request.subjectId) if request.subjectId else None
    if request.subjectId and not sid:
        raise HTTPException(status_code=400, detail="Invalid subject ID")
    if sid and not db()[main.SUBJECT_COLLECTION].find_one({"_id": sid, "isActive": {"$ne": False}}):
        raise HTTPException(status_code=404, detail="Subject not found")
    result = db()[main.KNOWLEDGE_COLLECTION].update_one({"_id": kid}, {"$set": {"title": request.title.strip(), "question": request.question.strip(),
        "answer": request.answer.strip(), "topic": request.topic.strip(), "keywords": request.keywords, "difficulty": request.difficulty.strip() or "beginner",
        "source": request.source.strip() or "EduBot Knowledge Base", "subject": sid, "updatedAt": now()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Knowledge record not found")
    main.load_knowledge()
    return {"success": True, "message": "Knowledge updated successfully"}


@router.delete("/admin/knowledge/{knowledge_id}")
def delete_knowledge(knowledge_id: str, user=Depends(admin_user)):
    kid = oid(knowledge_id)
    if not kid:
        raise HTTPException(status_code=400, detail="Invalid knowledge ID")
    result = db()[main.KNOWLEDGE_COLLECTION].update_one({"_id": kid}, {"$set": {"isActive": False, "updatedAt": now()}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Knowledge record not found")
    main.load_knowledge()
    return {"success": True, "message": "Knowledge deactivated successfully"}


@router.post("/admin/reload")
def admin_reload(user=Depends(admin_user)):
    return main.reload_knowledge()


@router.get("/admin/feedback")
def admin_feedback(user=Depends(admin_user)):
    items = list(feedback_col().find({}).sort("createdAt", -1).limit(200))
    result = []
    for x in items:
        student = users_col().find_one({"_id": x.get("user")}, {"name": 1, "email": 1}) if x.get("user") else None
        result.append({"id": str(x["_id"]), "rating": x.get("rating", 0), "helpful": x.get("helpful", False),
                       "comment": x.get("comment", ""), "user": {"name": student.get("name", "Student"), "email": student.get("email", "")} if student else None,
                       "messageId": str(x.get("message"))})
    return {"success": True, "feedback": result}
