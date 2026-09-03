import os
import time
from contextlib import asynccontextmanager
from typing import Optional

import faiss
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from transformers import pipeline

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGODB_DB", "edubot")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
GENERATION_MODEL = os.getenv("GENERATION_MODEL", "google/flan-t5-small")
TOP_K = max(1, min(int(os.getenv("TOP_K", "5")), 20))
MIN_SCORE = float(os.getenv("MIN_RETRIEVAL_SCORE", "0.25"))

embedding_model = SentenceTransformer(EMBEDDING_MODEL)
generator = pipeline("text2text-generation", model=GENERATION_MODEL)
index = None
knowledge = []
client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000) if MONGO_URI else None


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
    return " ".join(
        str(item.get(k, ""))
        for k in ("title", "question", "answer", "topic", "keywords")
    ).strip()


def load_knowledge():
    global index, knowledge
    if client is None:
        knowledge, index = [], None
        return

    try:
        collection = client[DB_NAME]["knowledge"]
        knowledge = list(collection.find({"isActive": {"$ne": False}}))
        texts = [knowledge_text(item) for item in knowledge]
        if not texts:
            index = None
            return

        vectors = embedding_model.encode(
            texts,
            normalize_embeddings=True,
            convert_to_numpy=True,
            show_progress_bar=False,
        ).astype("float32")
        index = faiss.IndexFlatIP(vectors.shape[1])
        index.add(vectors)
    except Exception as exc:
        knowledge, index = [], None
        raise RuntimeError(f"Knowledge loading failed: {exc}") from exc


def retrieve(query: str, subject: Optional[str] = None):
    if index is None or not knowledge:
        return []

    vector = embedding_model.encode(
        [query], normalize_embeddings=True, convert_to_numpy=True, show_progress_bar=False
    ).astype("float32")
    scores, ids = index.search(vector, min(TOP_K, len(knowledge)))

    results = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < 0:
            continue
        item = knowledge[idx]
        item_subject = item.get("subject", "")
        if subject and str(item_subject).lower() != subject.lower():
            continue
        score = float(score)
        if score < MIN_SCORE:
            continue
        results.append({
            "title": item.get("title", "Untitled"),
            "answer": item.get("answer", ""),
            "score": score,
            "topic": item.get("topic", ""),
        })
    return results


def generate_answer(query: str, contexts: list[dict]) -> str:
    if not contexts:
        return (
            "I could not find sufficiently relevant syllabus-aligned material for this question. "
            "Please rephrase the question or add the required academic material to the knowledge base."
        )

    context = "\n\n".join(
        f"Source {i + 1}: {c['title']}\n{c['answer']}"
        for i, c in enumerate(contexts)
    )
    prompt = (
        "You are EduBot, an educational assistant. Answer the student's question using only the supplied academic context. "
        "Do not invent facts. If the context is insufficient, clearly say that the information is not available. "
        "Give a concise, student-friendly explanation.\n\n"
        f"Academic context:\n{context}\n\nStudent question: {query}\nAnswer:"
    )
    result = generator(prompt, max_new_tokens=180, do_sample=False)[0]["generated_text"].strip()
    return result or "The retrieved material did not contain enough information to answer confidently."


@asynccontextmanager
async def lifespan(app: FastAPI):
    if client is not None:
        try:
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
    description="Research-paper-aligned Retrieval-Augmented Generation prototype.",
    lifespan=lifespan,
)


@app.get("/health")
def health():
    database = "disconnected"
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
    }


@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    started = time.perf_counter()
    contexts = retrieve(request.message.strip(), request.subject)
    answer = generate_answer(request.message.strip(), contexts)
    latency_ms = round((time.perf_counter() - started) * 1000, 2)
    return ChatResponse(
        answer=answer,
        sources=contexts,
        retrieval_count=len(contexts),
        latency_ms=latency_ms,
        grounded=bool(contexts),
    )


@app.post("/reload")
def reload_knowledge():
    try:
        load_knowledge()
        return {"success": True, "knowledge_records": len(knowledge)}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
