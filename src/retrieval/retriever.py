import logging
import math
from typing import Dict, Any, List
from src.db_pg import SessionLocal
from src.models import PolicyChunkModel
from src.retrieval.embeddings import get_embeddings_model

logger = logging.getLogger(__name__)

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1)) or 1.0
    norm2 = math.sqrt(sum(b * b for b in v2)) or 1.0
    return dot / (norm1 * norm2)

class KnowledgeRetriever:
    """
    Service layer for querying PolicyChunkModel vector store in database.
    """
    def __init__(self, db_path: str = None):
        self.embeddings = get_embeddings_model()

    def retrieve(self, query: str, k: int = 5, score_threshold: float = 0.25) -> Dict[str, Any]:
        """
        Queries PolicyChunkModel database index using consistent embeddings model.
        Returns:
            Dict containing:
                - context: formatted text block
                - sources: list of source document names and matching parts
                - confidence: float confidence estimate
                - raw_chunks: list of dict details
        """
        db = SessionLocal()
        try:
            query_vec = self.embeddings.embed_query(query)
            chunks = db.query(PolicyChunkModel).all()

            if not chunks:
                logger.warning("No PolicyChunkModel records found in vector store database.")
                return {
                    "context": "",
                    "sources": [],
                    "confidence": 0.0,
                    "raw_chunks": []
                }

            scored_chunks = []
            for chunk in chunks:
                if not chunk.embedding:
                    continue
                score = cosine_similarity(query_vec, chunk.embedding)
                scored_chunks.append((chunk, score))

            scored_chunks.sort(key=lambda x: x[1], reverse=True)
            top_matches = [item for item in scored_chunks[:k] if item[1] >= score_threshold]

            if not top_matches:
                return {
                    "context": "",
                    "sources": [],
                    "confidence": 0.0,
                    "raw_chunks": []
                }

            formatted_contexts = []
            sources = []
            raw_chunks = []
            score_sum = 0.0

            for idx, (chunk, score) in enumerate(top_matches):
                score_sum += score
                content = chunk.chunk_text.strip()
                title = chunk.clause_title or f"Clause {idx+1}"
                doc_name = chunk.document_name

                formatted_contexts.append(f"[{idx+1}] Source: {doc_name} ({title})\nContent: {content}")

                sources.append({
                    "id": idx + 1,
                    "file": doc_name,
                    "category": title,
                    "snippet": content[:180] + "..." if len(content) > 180 else content
                })

                raw_chunks.append({
                    "content": content,
                    "metadata": {"source": doc_name, "category": title},
                    "relevance_score": float(score)
                })

            avg_score = score_sum / len(top_matches) if top_matches else 0.0
            scaled_confidence = min(1.0, round(avg_score, 2))

            return {
                "context": "\n\n".join(formatted_contexts),
                "sources": sources,
                "confidence": scaled_confidence,
                "raw_chunks": raw_chunks
            }
        except Exception as e:
            logger.error(f"Error during PolicyChunkModel vector retrieval: {e}")
            return {
                "context": "",
                "sources": [],
                "confidence": 0.0,
                "raw_chunks": [],
                "error": str(e)
            }
        finally:
            db.close()

