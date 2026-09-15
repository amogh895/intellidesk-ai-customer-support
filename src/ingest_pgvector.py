import os
import sys
import math
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.db_pg import SessionLocal, init_db
from src.models import PolicyChunkModel

load_dotenv()

def generate_simple_embedding(text: str, dim: int = 384):
    words = text.lower().split()
    vector = [0.0] * dim
    for idx, word in enumerate(words):
        hash_val = hash(word)
        pos = abs(hash_val) % dim
        vector[pos] += 1.0 / (idx + 1)
    norm = math.sqrt(sum(x * x for x in vector)) or 1.0
    return [round(x / norm, 5) for x in vector]

def chunk_document(text: str, chunk_size: int = 500, overlap: int = 100):
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)
        start += (chunk_size - overlap)
    return chunks

def ingest_policy_documents():
    init_db()
    db = SessionLocal()

    try:
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        policy_files = [
            "Vehicle_Insurance_Policy_Handbook_2026_2027.md",
            "Auto_Insurance.md",
            "claims_manual.md",
            "policy_handbook.md",
            "support_sop.md"
        ]

        print("Starting ingestion of policy handbook documents into pgvector index...")

        # Clear existing chunks
        db.query(PolicyChunkModel).delete()
        db.commit()

        total_chunks = 0
        for fname in policy_files:
            fpath = os.path.join(data_dir, fname)
            if not os.path.exists(fpath):
                print(f"Skipping {fname} (file not found)")
                continue

            with open(fpath, "r", encoding="utf-8") as f:
                content = f.read()

            chunks = chunk_document(content, chunk_size=500, overlap=100)
            print(f"File {fname}: Read {len(content)} chars -> Generated {len(chunks)} chunks.")

            for idx, chunk_str in enumerate(chunks):
                lines = chunk_str.strip().split("\n")
                title = lines[0] if lines[0].startswith("#") or lines[0].startswith("Clause") else f"{fname} Chunk {idx+1}"
                
                vector = generate_simple_embedding(chunk_str)

                chunk_obj = PolicyChunkModel(
                    document_name=fname,
                    chunk_index=idx,
                    clause_title=title.replace("#", "").strip(),
                    chunk_text=chunk_str,
                    chunk_size=500,
                    embedding=vector
                )
                db.add(chunk_obj)
                total_chunks += 1

        db.commit()
        print(f"\n[OK] Ingestion complete! Total Policy Vector Embeddings in pgvector: {total_chunks}")
        return total_chunks
    except Exception as e:
        db.rollback()
        print(f"Error during ingestion: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    ingest_policy_documents()
