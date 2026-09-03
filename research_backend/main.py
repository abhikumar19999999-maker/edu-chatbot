import os
from pathlib import Path
from typing import Optional

import faiss
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer

load_dotenv()

app = FastAPI(title="EduBot Research API", version="1.0.0")

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGODB_DB", "edubot")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
TOP_K = int(os.getenv("TOP_K", "5"))

model = SentenceTransformer(EMBEDDING_MODEL)
index = None
knowledge = []
client = MongoClient(MONGO_URI) if MONGO_URI else None

class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    subject: Optional[str] = None

class ChatResponse(BaseModel):
    answer: str
    sources: list[dict]
    retrieval_count: int


def load_knowledge():
    global index, knowledge
    if client is None:
        knowledge = []
        index = None
        return
    collection = client[DB_NAME]["knowledge"]
    knowledge = list(collection.find({"isActive": {"$ne": False}}))
    texts = []
    for item in knowledge:
        texts.append(" ".join(str(item.get(k, "")) for k in ("title", "question", "answer", "topic", "keywords")))
    if not texts:
        index = None
        return
    vectors = model.encode(texts, normalize_embeddings=True, convert_to_numpy=True).astype("float32")
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)


def retrieve(query: str, subject: Optional[str] = None):
    if index is None or not knowledge:
        return []
    vector = model.encode([query], normalize_embeddings=True, convert_to_numpy=True).astype("float32")
    scores, ids = index.search(vector, min(TOP_K, len(knowledge)))
    results = []
    for score, idx in zip(scores[0], ids[0]):
        if idx < 0:
            continue
        item = knowledge[idx]
        if subject and str(item.get("subject", "")).lower() != subject.lower():
            continue
        results.append({"title": item.get("title", "Untitled"), "answer": item.get("answer", ""), "score": float(score), "topic": item.get("topic", "")})
    return results


def generate_answer(query: str, contexts: list[dict]) -> str:
    if not contexts:
        return "I could not find relevant syllabus-aligned material for this question. Please try another academic question or add the required material to the knowledge base."
    context = "\n\n".join(f"Source: {c['title']}\n{c['answer']}" for c in contexts)
    # Grounded deterministic response layer. A hosted/local generative Transformer can replace this function.
    return f"Based on the retrieved academic material:\n\n{context}\n\nQuestion: {query}"

@app.on_event("startup")
def startup():
    load_knowledge()

@app.get("/health")
def health():
    return {"success": True, "service": "EduBot Research API", "vector_store": "FAISS", "knowledge_records": len(knowledge)}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    contexts = retrieve(request.message, request.subject)
    return ChatResponse(answer=generate_answer(request.message, contexts), sources=contexts, retrieval_count=len(contexts))

@app.post("/reload")
def reload_knowledge():
    load_knowledge()
    return {"success": True, "knowledge_records": len(knowledge)}
