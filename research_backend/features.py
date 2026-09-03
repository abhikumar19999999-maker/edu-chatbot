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


def public_user(user):
    return {"id": str(user["_id"]), "name": user.get("name", "Student"), "email": user.get("email", ""),
            "role": user.get("role", "student"), "avatar": user.get("avatar", "")}


def token_for(user_id):
    if len(main.env_value("JWT_SECRET", "")) < 32:
        raise HTTPException(status_code=500, detail="JWT_SECRET is not configured correctly")
    return jwt.encode({"userId": str(user_id), "exp": datetime.now(timezone.utc) + timedelta(days=7)},
                      main.env_value("JWT_SECRET", ""), algorithm="HS256")


def current_user(edubot_session: Optional[str] = Cookie(default=None)):
    if not edubot_session:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        payload = jwt.decode(edubot_session, main.env_value("JWT_SECRET", ""), algorithms=["HS256"])
        user_id = oid(payload.get("userId"))
        if not user_id:
            raise ValueError("invalid user")
        user = main.client[main.DB_NAME][main.env_value("MONGODB_USER_COLLECTION", "users")].find_one(
            {"_id": user_id, "isActive": {"$ne": False}}
        )
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


def db():
    return main.client[main.DB_NAME]


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
    icon: str = Field(default="📚", max_length=10)


class KnowledgeRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    question: str = Field(default="", max_length=1000)
    answer: str = Field(min_length=2, max_length=10000)
    topic: str = Field(default="", max_length=200)
    keywords: list[str] = Field(default_factory=list)
    subjectId: Optional[str] = None


@router.post("/auth/register")
def register(request: RegisterRequest, response: Response):
    users = db()[main.env_value("MONGODB_USER_COLLECTION", "users")]
    email = request.email.strip().lower()
    if users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="User with this email already exists")
    now = datetime.now(timezone.utc)
    user = {"name": request.name.strip(), "email": email,
            "password": bcrypt.hashpw(request.password.encode(), bcrypt.gensalt(12)).decode(),
            "role": "student", "avatar": "", "isActive": True, "createdAt": now, "updatedAt": now}
    result = users.insert_one(user)
    user["_id"] = result.inserted_id
    response.set_cookie(COOKIE_NAME, token_for(result.inserted_id), httponly=True, secure=True,
                        samesite="none", max_age=7 * 24 * 3600, path="/")
    return {"success": True, "message": "Registration successful", "user": public_user(user)}


@router.post("/auth/login")
def login(request: LoginRequest, response: Response):
    users = db()[main.env_value("MONGODB_USER_COLLECTION", "users")]
    user = users.find_one({"email": request.email.strip().lower()})
    if not user or user.get("isActive") is False:
        raise HTTPException(status_code=401, detail="Invalid email or password")
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
    collection = db()[main.SUBJECT_COLLECTION]
    items = list(collection.find({"isActive": {"$ne": False}}, {"name": 1, "icon": 1}).sort("name", 1))
    return {"success": True, "subjects": [{"_id": str(x["_id"]), "name": x.get("name", ""), "icon": x.get("icon", "📚")} for x in items]}


@router.post("/chat")
def app_chat(request: AppChatRequest, user=Depends(current_user)):
    main.require_ready() if hasattr(main, "require_ready") else None
    database = db()
    conversations = database[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")]
    messages = database[main.env_value("MONGODB_MESSAGE_COLLECTION", "messages")]
    subject_collection = database[main.SUBJECT_COLLECTION]
    subject = None
    if request.subjectId:
        sid = oid(request.subjectId)
        if sid:
            subject = subject_collection.find_one({"_id": sid, "isActive": {"$ne": False}})
    conversation = None
    if request.conversationId:
        cid = oid(request.conversationId)
        if cid:
            conversation = conversations.find_one({"_id": cid, "user": user["_id"], "isActive": True})
    now = datetime.now(timezone.utc)
    if not conversation:
        conversation = {"user": user["_id"], "subject": subject["_id"] if subject else None,
                        "title": request.message.strip()[:80] or "New Conversation", "lastMessageAt": now,
                        "isActive": True, "createdAt": now, "updatedAt": now}
        conversation["_id"] = conversations.insert_one(conversation).inserted_id
    elif subject and not conversation.get("subject"):
        conversations.update_one({"_id": conversation["_id"]}, {"$set": {"subject": subject["_id"], "updatedAt": now}})
        conversation["subject"] = subject["_id"]

    user_message = {"conversation": conversation["_id"], "sender": "user", "content": request.message.strip(),
                    "subject": subject["_id"] if subject else conversation.get("subject"), "createdAt": now, "updatedAt": now}
    user_message["_id"] = messages.insert_one(user_message).inserted_id
    contexts = main.retrieve(request.message.strip(), subject.get("name") if subject else None)
    answer = main.generate_answer(request.message.strip(), contexts)
    best = contexts[0] if contexts else None
    bot_message = {"conversation": conversation["_id"], "sender": "bot", "content": answer, "intent": "general",
                   "subject": subject["_id"] if subject else conversation.get("subject"),
                   "sourceKnowledge": oid(best.get("id")) if best and best.get("id") else None,
                   "retrievalScore": best["score"] if best else 0, "createdAt": now, "updatedAt": now}
    bot_message["_id"] = messages.insert_one(bot_message).inserted_id
    conversations.update_one({"_id": conversation["_id"]}, {"$set": {"lastMessageAt": now, "updatedAt": now}})
    subject_public = {"_id": str(subject["_id"]), "name": subject.get("name"), "icon": subject.get("icon", "📚")} if subject else None
    return {"success": True, "message": answer,
            "conversation": {"id": str(conversation["_id"]), "title": conversation.get("title"), "subject": subject_public},
            "messageData": {"user": {"_id": str(user_message["_id"])}, "bot": {"_id": str(bot_message["_id"]), "retrievalScore": bot_message["retrievalScore"]}},
            "analysis": {"retrievalScore": best["score"] if best else 0, "source": best["title"] if best else None},
            "sources": contexts, "grounded": bool(contexts)}


@router.get("/chat/history")
def history(user=Depends(current_user)):
    database = db()
    conversations = database[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")]
    items = list(conversations.find({"user": user["_id"], "isActive": True}).sort("lastMessageAt", -1).limit(50))
    result = []
    for item in items:
        subject = database[main.SUBJECT_COLLECTION].find_one({"_id": item.get("subject")}, {"name": 1, "icon": 1}) if item.get("subject") else None
        result.append({"_id": str(item["_id"]), "title": item.get("title", "New Conversation"),
                       "subject": {"_id": str(subject["_id"]), "name": subject.get("name"), "icon": subject.get("icon", "📚")} if subject else None,
                       "lastMessageAt": item.get("lastMessageAt")})
    return {"success": True, "count": len(result), "conversations": result}


@router.get("/chat/{conversation_id}")
def conversation(conversation_id: str, user=Depends(current_user)):
    cid = oid(conversation_id)
    if not cid:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    database = db()
    item = database[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")].find_one({"_id": cid, "user": user["_id"], "isActive": True})
    if not item:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = list(database[main.env_value("MONGODB_MESSAGE_COLLECTION", "messages")].find({"conversation": cid}).sort("createdAt", 1))
    subject = database[main.SUBJECT_COLLECTION].find_one({"_id": item.get("subject")}, {"name": 1, "icon": 1}) if item.get("subject") else None
    return {"success": True, "conversation": {"_id": str(cid), "title": item.get("title"), "subject": {"_id": str(subject["_id"]), "name": subject.get("name"), "icon": subject.get("icon", "📚")} if subject else None},
            "messages": [{"_id": str(m["_id"]), "content": m.get("content", ""), "sender": m.get("sender", "bot"), "retrievalScore": m.get("retrievalScore", 0)} for m in messages]}


@router.delete("/chat/{conversation_id}")
def delete_conversation(conversation_id: str, user=Depends(current_user)):
    cid = oid(conversation_id)
    if not cid:
        raise HTTPException(status_code=400, detail="Invalid conversation ID")
    result = db()[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")].update_one({"_id": cid, "user": user["_id"]}, {"$set": {"isActive": False, "updatedAt": datetime.now(timezone.utc)}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"success": True, "message": "Conversation deleted"}


@router.post("/feedback")
def feedback(request: FeedbackRequest, user=Depends(current_user)):
    mid = oid(request.messageId)
    if not mid:
        raise HTTPException(status_code=400, detail="Invalid message ID")
    database = db()
    message = database[main.env_value("MONGODB_MESSAGE_COLLECTION", "messages")].find_one({"_id": mid, "sender": "bot"})
    if not message:
        raise HTTPException(status_code=404, detail="Bot message not found")
    conversation = database[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")].find_one({"_id": message["conversation"], "user": user["_id"]})
    if not conversation:
        raise HTTPException(status_code=403, detail="Not your message")
    now = datetime.now(timezone.utc)
    database[main.env_value("MONGODB_FEEDBACK_COLLECTION", "feedbacks")].update_one(
        {"message": mid, "user": user["_id"]},
        {"$set": {"message": mid, "user": user["_id"], "conversation": message["conversation"], "rating": request.rating, "helpful": request.helpful, "comment": request.comment, "updatedAt": now}, "$setOnInsert": {"createdAt": now}}, upsert=True)
    return {"success": True, "message": "Thanks for your feedback"}


@router.get("/feedback/mine")
def feedback_mine(user=Depends(current_user)):
    items = list(db()[main.env_value("MONGODB_FEEDBACK_COLLECTION", "feedbacks")].find({"user": user["_id"]}).sort("createdAt", -1).limit(100))
    return {"success": True, "feedback": [{"messageId": str(x.get("message")), "rating": x.get("rating", 0), "helpful": x.get("helpful", False), "comment": x.get("comment", "")} for x in items]}


@router.get("/dashboard")
def dashboard(user=Depends(current_user)):
    database = db()
    conv_col = database[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")]
    msg_col = database[main.env_value("MONGODB_MESSAGE_COLLECTION", "messages")]
    fb_col = database[main.env_value("MONGODB_FEEDBACK_COLLECTION", "feedbacks")]
    conversations = list(conv_col.find({"user": user["_id"], "isActive": True}).sort("lastMessageAt", -1))
    ids = [x["_id"] for x in conversations]
    questions = msg_col.count_documents({"conversation": {"$in": ids}, "sender": "user"}) if ids else 0
    bots = msg_col.count_documents({"conversation": {"$in": ids}, "sender": "bot"}) if ids else 0
    feedback_items = list(fb_col.find({"user": user["_id"]}, {"rating": 1, "helpful": 1}))
    avg = round(sum(float(x.get("rating", 0)) for x in feedback_items) / len(feedback_items), 2) if feedback_items else 0
    subject_ids = {str(x.get("subject")) for x in conversations if x.get("subject")}
    studied = []
    for sid in subject_ids:
        subject = database[main.SUBJECT_COLLECTION].find_one({"_id": oid(sid)}, {"name": 1, "icon": 1})
        if subject:
            studied.append({"id": sid, "name": subject.get("name", ""), "icon": subject.get("icon", "📚")})
    recent = [{"id": str(x["_id"]), "title": x.get("title", "New Conversation"), "lastMessageAt": x.get("lastMessageAt")} for x in conversations[:5]]
    return {"success": True, "stats": {"totalConversations": len(conversations), "questionsAsked": questions, "botResponses": bots,
            "helpfulAnswers": sum(1 for x in feedback_items if x.get("helpful") is True), "averageRating": avg,
            "totalFeedback": len(feedback_items), "subjectsStudied": len(studied)}, "subjects": studied, "recentConversations": recent}


@router.get("/admin/dashboard")
def admin_dashboard(user=Depends(admin_user)):
    database = db()
    return {"success": True, "stats": {"users": database[main.env_value("MONGODB_USER_COLLECTION", "users")].count_documents({}),
            "students": database[main.env_value("MONGODB_USER_COLLECTION", "users")].count_documents({"role": "student"}),
            "conversations": database[main.env_value("MONGODB_CONVERSATION_COLLECTION", "conversations")].count_documents({"isActive": True}),
            "knowledge": database[main.KNOWLEDGE_COLLECTION].count_documents({"isActive": {"$ne": False}}),
            "feedback": database[main.env_value("MONGODB_FEEDBACK_COLLECTION", "feedbacks")].count_documents({})}}


@router.get("/admin/users")
def admin_users(user=Depends(admin_user)):
    items = list(db()[main.env_value("MONGODB_USER_COLLECTION", "users")].find({}, {"password": 0}).sort("createdAt", -1).limit(200))
    return {"success": True, "users": [{**public_user(x), "isActive": x.get("isActive", True), "createdAt": x.get("createdAt")} for x in items]}


@router.patch("/admin/users/{user_id}/status")
def admin_status(user_id: str, active: bool, user=Depends(admin_user)):
    uid = oid(user_id)
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    db()[main.env_value("MONGODB_USER_COLLECTION", "users")].update_one({"_id": uid}, {"$set": {"isActive": active, "updatedAt": datetime.now(timezone.utc)}})
    return {"success": True}


@router.post("/admin/subjects")
def admin_subject(request: SubjectRequest, user=Depends(admin_user)):
    result = db()[main.SUBJECT_COLLECTION].insert_one({"name": request.name.strip(), "icon": request.icon, "isActive": True, "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)})
    main.load_subjects()
    return {"success": True, "id": str(result.inserted_id)}


@router.post("/admin/knowledge")
def admin_knowledge(request: KnowledgeRequest, user=Depends(admin_user)):
    result = db()[main.KNOWLEDGE_COLLECTION].insert_one({"title": request.title.strip(), "question": request.question.strip(), "answer": request.answer.strip(), "topic": request.topic.strip(), "keywords": request.keywords, "subject": oid(request.subjectId) if request.subjectId else None, "isActive": True, "createdAt": datetime.now(timezone.utc), "updatedAt": datetime.now(timezone.utc)})
    main.load_knowledge()
    return {"success": True, "id": str(result.inserted_id)}


@router.get("/admin/feedback")
def admin_feedback(user=Depends(admin_user)):
    items = list(db()[main.env_value("MONGODB_FEEDBACK_COLLECTION", "feedbacks")].find({}).sort("createdAt", -1).limit(200))
    return {"success": True, "feedback": [{"id": str(x["_id"]), "rating": x.get("rating", 0), "helpful": x.get("helpful", False), "comment": x.get("comment", ""), "user": str(x.get("user")), "messageId": str(x.get("message"))} for x in items]}
