import asyncio
import os
import time
from contextlib import asynccontextmanager
from typing import Optional

import faiss
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer

load_dotenv()

def env_value(name: str, default: str) -> str:
    value = os.getenv(name, default)
    return value.strip().splitlines()[0].strip() if value else default

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
CONFIGURED_DB_NAME = env_value("MONGODB_DB", "")
KNOWLEDGE_COLLECTION = env_value("MONGODB_KNOWLEDGE_COLLECTION", "knowledges")
SUBJECT_COLLECTION = env_value("MONGODB_SUBJECT_COLLECTION", "subjects")
EMBEDDING_MODEL = env_value("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
GENERATION_MODEL = env_value("GENERATION_MODEL", "google/flan-t5-small")
TOP_K = max(1, min(int(env_value("TOP_K", "3")), 5))
MIN_SCORE = float(env_value("MIN_RETRIEVAL_SCORE", "0.25"))
FRONTEND_URL = env_value("FRONTEND_URL", "*")
ENABLE_LOCAL_GENERATION = env_value("ENABLE_LOCAL_GENERATION", "false").lower() == "true"

embedding_model = None
generator = None
index = None
knowledge = []
subject_names = {}
initialization_task = None
initialization_status = "starting"
initialization_error = None
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000) if MONGO_URI else None
DB_NAME = CONFIGURED_DB_NAME or "edubot"

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    subject: Optional[str] = Field(default=None, max_length=200)
class Source(BaseModel):
    title: str
    answer: str
    topic: str = ""
    score: float
class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    retrieval_count: int
    latency_ms: float
    grounded: bool

def normalize(value) -> str:
    return " ".join(str(value or "").strip().lower().split())

def knowledge_text(item):
    values = []
    for key in ("title", "question", "answer", "topic", "keywords"):
        value = item.get(key, "")
        if isinstance(value, list): value = " ".join(map(str, value))
        if value: values.append(str(value))
    return " ".join(values).strip()

def choose_database():
    global DB_NAME
    if client is None: return
    candidates = []
    if CONFIGURED_DB_NAME: candidates.append(CONFIGURED_DB_NAME)
    try:
        default_db = client.get_default_database()
        if default_db is not None and default_db.name not in candidates: candidates.append(default_db.name)
    except Exception: pass
    try:
        for name in client.list_database_names():
            if name not in candidates and name not in {"admin", "local", "config"}: candidates.append(name)
    except Exception as exc: print(f"MongoDB database discovery skipped: {exc}")
    for name in candidates:
        try:
            collections = set(client[name].list_collection_names())
            if SUBJECT_COLLECTION in collections or KNOWLEDGE_COLLECTION in collections:
                DB_NAME = name; print(f"Using MongoDB database: {DB_NAME}"); return
        except Exception as exc: print(f"Could not inspect database '{name}': {exc}")
    if candidates: DB_NAME = candidates[0]

def load_subjects():
    global subject_names
    subject_names = {}
    if client is None: return
    for item in client[DB_NAME][SUBJECT_COLLECTION].find({"isActive": {"$ne": False}}, {"name": 1}):
        name = str(item.get("name", "")).strip()
        if name:
            subject_names[str(item.get("_id"))] = name
            subject_names[normalize(name)] = name

def item_subject_name(item) -> str:
    value = item.get("subject", "")
    if isinstance(value, dict): value = value.get("name", "")
    key = str(value)
    return subject_names.get(key, key)

def load_knowledge():
    global index, knowledge
    if client is None: knowledge, index = [], None; return
    collection = client[DB_NAME][KNOWLEDGE_COLLECTION]
    knowledge = list(collection.find({"isActive": {"$ne": False}}))
    texts = [knowledge_text(item) for item in knowledge]
    valid = [(item, text) for item, text in zip(knowledge, texts) if text]
    knowledge = [item for item, _ in valid]; texts = [text for _, text in valid]
    if not texts: index = None; return
    vectors = embedding_model.encode(texts, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False, batch_size=8).astype("float32")
    new_index = faiss.IndexFlatIP(vectors.shape[1]); new_index.add(vectors); index = new_index

def retrieve(query: str, subject: Optional[str] = None):
    if index is None or not knowledge or embedding_model is None: return []
    vector = embedding_model.encode([query], normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False).astype("float32")
    candidate_k = min(max(TOP_K * 10, 20), len(knowledge)); scores, ids = index.search(vector, candidate_k)
    requested_subject = normalize(subject); results = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < 0: continue
        item = knowledge[int(idx)]
        if requested_subject and normalize(item_subject_name(item)) != requested_subject: continue
        score = float(score)
        if score < MIN_SCORE: continue
        results.append({"id": str(item.get("_id")) if item.get("_id") else None, "title": str(item.get("title", "Untitled")), "answer": str(item.get("answer", "")), "score": round(score, 4), "topic": str(item.get("topic", ""))})
        if len(results) >= TOP_K: break
    return results

def extractive_answer(query: str, contexts: list[dict]) -> str:
    if not contexts: return "I could not find sufficiently relevant syllabus-aligned material. Please rephrase the question or add the required material to the knowledge base."
    best = contexts[0]["answer"].strip()
    if not best: return "The retrieved material did not contain enough information to answer confidently."
    return f"Based on the retrieved academic material: {best}"

def generate_answer(query: str, contexts: list[dict]) -> str:
    if not contexts: return extractive_answer(query, contexts)
    if generator is None: return extractive_answer(query, contexts)
    context = "\n\n".join(f"Source {i + 1}: {c['title']}\n{c['answer']}" for i, c in enumerate(contexts))
    prompt = ("You are EduBot, an educational assistant. Answer the student's question using only the supplied academic context. Do not invent facts. If the context is insufficient, say the information is not available. Keep the explanation clear and concise.\n\n" f"Academic context:\n{context}\n\nStudent question: {query}\nAnswer:")
    result = generator(prompt, max_new_tokens=120, do_sample=False)[0]["generated_text"].strip()
    return result or extractive_answer(query, contexts)

async def initialize_backend():
    global embedding_model, generator, initialization_status, initialization_error
    try:
        initialization_status = "loading_embedding_model"
        print(f"Loading embedding model in background: {EMBEDDING_MODEL}")
        embedding_model = await asyncio.to_thread(SentenceTransformer, EMBEDDING_MODEL, device="cpu")
        if ENABLE_LOCAL_GENERATION:
            from transformers import pipeline
            initialization_status = "loading_generation_model"
            generator = await asyncio.to_thread(pipeline, "text2text-generation", model=GENERATION_MODEL, device=-1)
        else: print("Local generation disabled; using memory-safe extractive RAG answers.")
        if client is not None:
            initialization_status = "loading_knowledge"
            await asyncio.to_thread(client.admin.command, "ping"); await asyncio.to_thread(choose_database); await asyncio.to_thread(load_subjects); await asyncio.to_thread(load_knowledge)
        initialization_status = "ready"; initialization_error = None
        print("EduBot research backend initialization complete.")
    except Exception as exc:
        initialization_status = "error"; initialization_error = str(exc); print(f"Background initialization warning: {exc}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    global initialization_task
    initialization_task = asyncio.create_task(initialize_backend()); yield
    if initialization_task and not initialization_task.done():
        initialization_task.cancel()
        try: await initialization_task
        except asyncio.CancelledError: pass
    if client is not None: client.close()

app = FastAPI(title="EduBot Research API", version="1.0.0", description="Research-paper-aligned RAG API using FastAPI, FAISS, Sentence Transformers and optional Hugging Face generation.", lifespan=lifespan)

allowed_origins = [FRONTEND_URL] if FRONTEND_URL != "*" else ["*"]
app.add_middleware(CORSMiddleware, allow_origins=allowed_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root(): return {"success": True, "service": "EduBot Research API", "docs": "/docs", "status": initialization_status}

@app.get("/health")
def health():
    database = "not_configured"
    if client is not None:
        try: client.admin.command("ping"); database = "connected"
        except Exception: database = "error"
    return {"success": True, "service": "EduBot Research API", "database": database, "database_name": DB_NAME, "vector_store": "FAISS", "embedding_model": EMBEDDING_MODEL, "generation_model": GENERATION_MODEL if ENABLE_LOCAL_GENERATION else "disabled (memory-safe RAG)", "knowledge_records": len(knowledge), "knowledge_collection": f"{DB_NAME}.{KNOWLEDGE_COLLECTION}", "subject_mappings": len(subject_names), "models_ready": embedding_model is not None, "local_generation": ENABLE_LOCAL_GENERATION, "initialization_status": initialization_status, "initialization_error": initialization_error}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if embedding_model is None: raise HTTPException(status_code=503, detail=f"EduBot AI models are still initializing (status: {initialization_status}). Please try again shortly.")
    started = time.perf_counter(); query = request.message.strip(); contexts = retrieve(query, request.subject); answer = generate_answer(query, contexts); latency_ms = round((time.perf_counter() - started) * 1000, 2)
    return ChatResponse(answer=answer, sources=contexts, retrieval_count=len(contexts), latency_ms=latency_ms, grounded=bool(contexts))

@app.post("/reload")
def reload_knowledge():
    if embedding_model is None: raise HTTPException(status_code=503, detail="Embedding model is not ready")
    try:
        choose_database(); load_subjects(); load_knowledge(); return {"success": True, "knowledge_records": len(knowledge), "subject_mappings": len(subject_names), "collection": f"{DB_NAME}.{KNOWLEDGE_COLLECTION}"}
    except Exception as exc: raise HTTPException(status_code=500, detail=f"Knowledge reload failed: {exc}") from exc
