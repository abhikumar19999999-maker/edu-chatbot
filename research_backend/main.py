import os
from typing import Optional

import faiss
import numpy as np
from dotenv import load_dotenv
from fastapi import FastAPI
from pydantic import BaseModel, Field
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from transformers import pipeline

load_dotenv()

app = FastAPI(title="EduBot Research API", version="1.0.0")
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
DB_NAME = os.getenv("MONGODB_DB", "edubot")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
GENERATION_MODEL = os.getenv("GENERATION_MODEL", "google/flan-t5-small")
TOP_K = int(os.getenv("TOP_K", "5"))

embedding_model = SentenceTransformer(EMBEDDING_MODEL)
generator = pipeline("text2text-generation", model=GENERATION_MODEL)
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
        knowledge, index = [], None
        return
    knowledge = list(client[DB_NAME]["knowledge"].find({"isActive": {"$ne": False}}))
    texts = [" ".join(str(item.get(k, "")) for k in ("title", "question", "answer", "topic", "keywords")) for item in knowledge]
    if not texts:
        index = None
        return
    vectors = embedding_model.encode(texts, normalize_embeddings=True, convert_to_numpy=True).astype("float32")
    index = faiss.IndexFlatIP(vectors.shape[1])
    index.add(vectors)


def retrieve(query: str, subject: Optional[str] = None):
    if index is None or not knowledge:
        return []
    vector = embedding_model.encode([query], normalize_embeddings=True, convert_to_numpy=True).astype("float32")
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
        return "I could not find relevant syllabus-aligned material for this question."
    context = "\n\n".join(f"Source: {c['title']}\n{c['answer']}" for c in contexts)
    prompt = ("Answer the student question using only the supplied academic context. "
              "If the context does not contain the answer, say that it is not available.\n\n"
              f"Context:\n{context}\n\nQuestion: {query}\nAnswer:")
    result = generator(prompt, max_new_tokens=180, do_sample=False)[0]["generated_text"].strip()
    return result or "The retrieved material did not contain enough information to answer confidently."

@app.on_event("startup")
def startup():
    load_knowledge()

@app.get("/health")
def health():
    return {"success": True, "service": "EduBot Research API", "vector_store": "FAISS", "embedding_model": EMBEDDING_MODEL, "generation_model": GENERATION_MODEL, "knowledge_records": len(knowledge)}

@app.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    contexts = retrieve(request.message, request.subject)
    return ChatResponse(answer=generate_answer(request.message, contexts), sources=contexts, retrieval_count=len(contexts))

@app.post("/reload")
def reload_knowledge():
    load_knowledge()
    return {"success": True, "knowledge_records": len(knowledge)}
