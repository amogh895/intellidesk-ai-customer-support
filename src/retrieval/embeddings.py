import os
import logging
from typing import List
from langchain_core.embeddings import Embeddings
from src.config.config import settings

logger = logging.getLogger(__name__)

class GeminiApiEmbeddings(Embeddings):
    """
    Lightweight Google GenAI embeddings (0 MB RAM footprint).
    Embeddings are computed via Google Gemini API instead of running heavy PyTorch locally.
    """
    def __init__(self, api_key: str = None, model: str = "text-embedding-004"):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model = model
        self._client = None
        if self.api_key:
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Google GenAI embeddings client: {e}")

    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        if not self._client or not texts:
            return self._fallback_embed(texts)
        try:
            embeddings = []
            # Batch call or per-item
            for text in texts:
                res = self._client.models.embed_content(
                    model=self.model,
                    contents=text[:2048]
                )
                embeddings.append(res.embedding.values)
            return embeddings
        except Exception as e:
            logger.warning(f"Gemini API embed_documents failed: {e}. Using fallback.")
            return self._fallback_embed(texts)

    def embed_query(self, text: str) -> List[float]:
        if not self._client or not text:
            return self._fallback_embed([text])[0]
        try:
            res = self._client.models.embed_content(
                model=self.model,
                contents=text[:2048]
            )
            return res.embedding.values
        except Exception as e:
            logger.warning(f"Gemini API embed_query failed: {e}. Using fallback.")
            return self._fallback_embed([text])[0]

    def _fallback_embed(self, texts: List[str]) -> List[List[float]]:
        """
        Lightweight deterministic fallback vector generator for offline/testing mode.
        """
        results = []
        dim = 768
        for text in texts:
            vec = [0.0] * dim
            tokens = text.lower().split()
            for token in tokens:
                h = abs(hash(token)) % dim
                vec[h] += 1.0
            # Normalize
            norm = sum(x * x for x in vec) ** 0.5
            if norm > 0:
                vec = [x / norm for x in vec]
            results.append(vec)
        return results


def get_embeddings_model() -> Embeddings:
    """
    Returns the most memory-efficient embedding provider available.
    Prefers Gemini API embeddings (0 MB RAM) to prevent Render/Cloud 512MB OOM errors.
    """
    if settings.GEMINI_API_KEY:
        try:
            return GeminiApiEmbeddings()
        except Exception as e:
            logger.warning(f"Failed to load GeminiApiEmbeddings: {e}")

    # Try HuggingFace if available with memory optimization
    try:
        from langchain_huggingface import HuggingFaceEmbeddings
        return HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
    except Exception as e:
        logger.warning(f"HuggingFace embeddings not available: {e}. Using GeminiApiEmbeddings fallback.")
        return GeminiApiEmbeddings()
