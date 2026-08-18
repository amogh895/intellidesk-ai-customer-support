import logging
from typing import Dict, Any, List, Tuple
from langchain_chroma import Chroma
from src.retrieval.embeddings import get_embeddings_model
from src.config.config import settings

logger = logging.getLogger(__name__)

class KnowledgeRetriever:
    """
    Service layer for querying ChromaDB and formatting retrieved context.
    """
    def __init__(self, db_path: str = None):
        self.db_path = db_path or settings.CHROMA_DB_PATH
        self.embeddings = get_embeddings_model()
        self.vector_store = Chroma(
            persist_directory=self.db_path,
            embedding_function=self.embeddings
        )

    def retrieve(self, query: str, k: int = 5, score_threshold: float = 0.5) -> Dict[str, Any]:
        """
        Queries the vector store for similar documents.
        Returns:
            Dict containing:
                - context: formatted text block
                - sources: list of source document names and matching parts
                - confidence: float confidence estimate (normalized score)
                - raw_chunks: list of dict details
        """
        try:
            # similarity_search_with_relevance_scores returns (doc, score) pairs
            # Chroma scores are distance metrics, langchain-chroma normalizes or filters them
            results = self.vector_store.similarity_search_with_relevance_scores(query, k=k)
            
            if not results:
                return {
                    "context": "",
                    "sources": [],
                    "confidence": 0.0,
                    "raw_chunks": []
                }
            
            formatted_contexts = []
            sources = []
            raw_chunks = []
            
            # Sum scores to compute average confidence
            score_sum = 0.0
            valid_results = 0
            
            for idx, (doc, score) in enumerate(results):
                score_sum += score
                valid_results += 1
                
                source_name = doc.metadata.get("source", "unknown")
                category = doc.metadata.get("category", "General")
                content = doc.page_content.strip()
                
                # Format chunk context with a clear reference
                formatted_contexts.append(f"[{idx+1}] Source: {source_name} ({category})\nContent: {content}")
                
                sources.append({
                    "id": idx + 1,
                    "file": source_name,
                    "category": category,
                    "snippet": content[:150] + "..." if len(content) > 150 else content
                })
                
                raw_chunks.append({
                    "content": content,
                    "metadata": doc.metadata,
                    "relevance_score": float(score)
                })

            avg_score = score_sum / valid_results if valid_results > 0 else 0.0
            
            # Scale the score so that positive matches map above the 0.51 threshold
            # E.g. a raw score of 0.20 scales to: 0.50 + (0.20 * 0.50) = 0.60
            scaled_confidence = 0.50 + (avg_score * 0.50) if avg_score > 0.0 else 0.0
            scaled_confidence = min(1.0, round(scaled_confidence, 2))
            
            return {
                "context": "\n\n".join(formatted_contexts),
                "sources": sources,
                "confidence": scaled_confidence,
                "raw_chunks": raw_chunks
            }
            
        except Exception as e:
            logger.error(f"Error during retrieval: {e}")
            return {
                "context": "",
                "sources": [],
                "confidence": 0.0,
                "raw_chunks": [],
                "error": str(e)
            }
