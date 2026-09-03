import os
import time

from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer

from main import load_knowledge, retrieve

load_dotenv()

QUERIES = [
    "What is supervised learning?",
    "Explain operating system process management.",
    "What is a data structure?",
    "What is machine learning?",
]


def main():
    load_knowledge()
    model = SentenceTransformer(os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2"))
    print(f"Knowledge records: {len(__import__('main').knowledge)}")
    print("\nRetrieval benchmark")
    print("-" * 70)

    for query in QUERIES:
        started = time.perf_counter()
        results = retrieve(query)
        elapsed = (time.perf_counter() - started) * 1000
        top = results[0]["score"] if results else 0.0
        print(f"Query: {query}")
        print(f"Results: {len(results)} | Top score: {top:.4f} | Retrieval: {elapsed:.2f} ms")
        for result in results[:3]:
            print(f"  - {result['title']} ({result['score']:.4f})")
        print()


if __name__ == "__main__":
    main()
