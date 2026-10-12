"""
Ingest documents into Qdrant.
Usage: python ingest.py ./docs
"""
import sys, os, uuid
from pathlib import Path
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

COLLECTION = "knowledge"
EMBED_MODEL = "all-MiniLM-L6-v2"
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

client = QdrantClient(":memory:")  # Use QdrantClient(url="http://localhost:6333") for persistence
model = SentenceTransformer(EMBED_MODEL)

def chunk_text(text: str):
    chunks = []
    start = 0
    while start < len(text):
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start = end - CHUNK_OVERLAP
    return chunks

def ingest(directory: str):
    # Recreate collection
    client.recreate_collection(
        collection_name=COLLECTION,
        vectors_config=VectorParams(size=384, distance=Distance.COSINE),
    )

    points = []
    for path in Path(directory).rglob("*"):
        if path.suffix.lower() not in {".txt", ".md", ".pdf"}:
            continue
        text = path.read_text(encoding="utf-8", errors="ignore")
        for chunk in chunk_text(text):
            vec = model.encode(chunk).tolist()
            points.append(
                PointStruct(
                    id=str(uuid.uuid4()),
                    vector=vec,
                    payload={"source": str(path), "text": chunk},
                )
            )

    if points:
        client.upsert(collection_name=COLLECTION, points=points)
    print(f"✅ Ingested {len(points)} chunks into '{COLLECTION}'.")

if __name__ == "__main__":
    ingest(sys.argv[1] if len(sys.argv) > 1 else "./docs")
