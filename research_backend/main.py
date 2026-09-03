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
from transformers import pipeline

load_dotenv()


def env_value(name: str, default: str) -> str:
    """Read a single clean environment value, tolerating accidental pasted newlines."""
    value = os.getenv(name, default)
    return value.strip().splitlines()[0].strip() if value else default


MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DB_NAME = env_value("MONGODB_DB", "edubot")
EMBEDDING_MODEL = env_value("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
GENERATION_MODEL = env_value("GENERATION_MODEL", "google/flan-t5-small")
TOP_K = max(1, min(int(env_value("TOP_K", "5")), 10))
MIN_SCORE = float(env_value("MIN_RETRIEVAL_SCORE", "0.25"))
FRONTEND_URL = env_value("FRONTEND_URL", "*")

embedding_model = None
generator = None
index = None
knowledge = []
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=8000) if MONGO_URI else None


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


def knowledge_text(item):
    values = []
    for key in ("title", "question", "answer", "topic", "keywords"):
        value = item.get(key, "")
        if isinstance(value, list):
            value = " ".join(map(str, value))
        if value:
            values.append(str(value))
    return " ".join(values).strip()


def load_knowledge():
    global index, knowledge
    if client is None:
        knowledge, index = [], None
        return

    collection = client[DB_NAME]["knowledge"]
    knowledge = list(collection.find({"isActive": {"$ne": False}}))
    texts = [knowledge_text(item) for item in knowledge]
    valid = [(item, text) for item, text in zip(knowledge, texts) if text]
    knowledge = [item for item, _ in valid]
    texts = [text for _, text in valid]

    if not texts:
        index = None
        return

    vectors = embedding_model.encode(
        texts, normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False
    ).astype("float32")
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)


def retrieve(query: str, subject: Optional[str] = None):
    if index is None or not knowledge:
        return []

    vector = embedding_model.encode(
        [query], normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False
    ).astype("float32")
    candidate_k = min(max(TOP_K * 3, TOP_K), len(knowledge))
    scores, ids = index.search(vector, candidate_k)

    results = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < 0:
            continue
        item = knowledge[int(idx)]
        item_subject = item.get("subject", "")
        if isinstance(item_subject, dict):
            item_subject = item_subject.get("name", "")
        if subject and str(item_subject).lower() != subject.lower():
            continue
        score = float(score)
        if score < MIN_SCORE:
            continue
        results.append({
            "title": str(item.get("title", "Untitled")),
            "answer": str(item.get("answer", "")),
            "score": round(score, 4),
            "topic": str(item.get("topic", "")),
        })
        if len(results) >= TOP_K:
            break
    return results


def generate_answer(query: str, contexts: list[dict]) -> str:
    if not contexts:
        return "I could not find sufficiently relevant syllabus-aligned material. Please rephrase the question or add the required material to the knowledge base."

    context = "\n\n".join(
        f"Source {i + 1}: {c['title']}\n{c['answer']}" for i, c in enumerate(contexts)
    )
    prompt = (
        "You are EduBot, an educational assistant. Answer the student's question using only the supplied academic context. "
        "Do not invent facts. If the context is insufficient, say the information is not available. "
        "Keep the explanation clear and concise.\n\n"
        f"Academic context:\n{context}\n\nStudent question: {query}\nAnswer:"
    )
    result = generator(prompt, max_new_tokens=160, do_sample=False)[0]["generated_text"].strip()
    return result or "The retrieved material did not contain enough information to answer confidently."


@asynccontextmanager
async def lifespan(app: FastAPI):
    global embedding_model, generator
    try:
        embedding_model = SentenceTransformer(EMBEDDING_MODEL, device="cpu")
        generator = pipeline("text2text-generation", model=GENERATION_MODEL, device=-1)
        if client is not None:
            client.admin.command("ping")
            load_knowledge()
    except Exception as exc:
        print(f"Startup warning: {exc}")
    yield
    if client is not None:
        client.close()


app = FastAPI(
    title="EduBot Research API",
    version="1.0.0",
    description="Simple research-paper-aligned RAG API using FastAPI, FAISS and Hugging Face.",
    lifespan=lifespan,
)

if FRONTEND_URL == "*":
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])
else:
    app.add_middleware(CORSMiddleware, allow_origins=[FRONTEND_URL], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])


@app.get("/")
def root():
    return {"success": True, "service": "EduBot Research API", "docs": "/docs"}


@app.get("/health")
def health():
    database = "not_configured"
    if client is not None:
        try:
            client.admin.command("ping")
            database = "connected"
        except Exception:
            database = "error"
    return {
        "success": True,
        "service": "EduBot Research API",
        "database": database,
        "vector_store": "FAISS",
        "embedding_model": EMBEDDING_MODEL,
        "generation_model": GENERATION_MODEL,
        "knowledge_records": len(knowledge),
        "models_ready": embedding_model is not None and generator is not None,
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    if embedding_model is None or generator is None:
        raise HTTPException(status_code=503, detail="AI models are still loading. Please try again shortly.")
    started = time.perf_counter()
    query = request.message.strip()
    contexts = retrieve(query, request.subject)
    answer = generate_answer(query, contexts)
    latency_ms = round((time.perf_counter() - started) * 1000, 2)
    return ChatResponse(answer=answer, sources=contexts, retrieval_count=len(contexts), latency_ms=latency_ms, grounded=bool(contexts))


@app.post("/reload")
def reload_knowledge():
    if embedding_model is None:
        raise HTTPException(status_code=503, detail="Embedding model is not ready")
    try:
        load_knowledge()
        return {"success": True, "knowledge_records": len(knowledge)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Knowledge reload failed: {exc}") from exc
