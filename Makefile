.PHONY: help seed ingest eval dev test

help:
	@echo "IntelliDesk Backend Commands:"
	@echo "  make seed   - Seed PostgreSQL with ~200 Faker customer, policy, claim, and ticket records"
	@echo "  make ingest - Ingest and chunk policy documents into pgvector embeddings index"
	@echo "  make eval   - Run RAGAS evaluation benchmark against golden QA set and chunk configurations"
	@echo "  make dev    - Launch FastAPI backend dev server on http://localhost:8000"
	@echo "  make test   - Run unit and integration pytest suite"

seed:
	python src/seed.py

ingest:
	python src/ingest_pgvector.py

eval:
	python evaluation/evaluator.py

dev:
	uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest tests/
