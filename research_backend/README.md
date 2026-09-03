# EduBot Research Backend

This backend implements the research-paper-oriented RAG prototype with Python, FastAPI, Sentence Transformers, FAISS, and a Hugging Face Transformer generator.

## Run

```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Environment

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=edubot
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
GENERATION_MODEL=google/flan-t5-small
TOP_K=5
```

The backend reads active records from the `knowledge` collection, builds a FAISS inner-product index over normalized embeddings, retrieves the top matching records, and generates an answer constrained to the retrieved context.

This is a research branch and does not replace the production Node.js/Express application until the branch is fully tested and reviewed.