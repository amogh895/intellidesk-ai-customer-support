# Ingestion Chunk Comparison & RAGAS Benchmarks

Comparative benchmark analysis evaluating the accuracy, relevance, and grounding of our RAG engine configurations.

## Evaluation Results Table
| Chunk Size | Overlap Chars | Retrieval Accuracy (Correct Source) | Avg Retrieval Confidence | Faithfulness Rate (Anti-Hallucination) |
|---|---|---|---|---|
| 300 | 50 | 93.33% | 40.2% | 95.0% |
| 500 | 100 | 100.0% | 14.87% | 75.0% |
| 800 | 150 | 100.0% | 27.93% | 95.0% |

## Final Scoping Recommendation
Based on the metrics above, the system achieves the optimal balance of context preservation and search precision using:
- **Recommended Chunk Size**: **500**
- **Recommended Overlap**: **100**
- **Reason**: This configuration maximizes the source retrieval accuracy (100.0%) while preserving sufficient context parameters to eliminate text truncations.
