from fastapi import FastAPI
from pydantic import BaseModel
from qdrant_client import QdrantClient
from sentence_transformers import SentenceTransformer

app = FastAPI(title="WhatsApp Bot RAG Service")

client = QdrantClient(":memory:")
model = SentenceTransformer("all-MiniLM-L6-v2")
COLLECTION = "knowledge"

class Query(BaseModel):
    question: str

@app.post("/query")
def query(q: Query):
    vec = model.encode(q.question).tolist()
    hits = client.search(
        collection_name=COLLECTION,
        query_vector=vec,
        limit=4,
    )
    context = "\n\n".join(hit.payload["text"] for hit in hits)
    return {"context": context, "sources": [h.payload["source"] for h in hits]}
