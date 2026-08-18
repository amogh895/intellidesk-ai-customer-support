import os
import shutil
import argparse
from pathlib import Path
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from src.retrieval.embeddings import get_embeddings_model
from src.config.config import settings

def load_documents(data_dir: Path):
    """
    Load all markdown documents from the data directory and attach metadata.
    """
    docs = []
    if not data_dir.exists():
        print(f"Data directory {data_dir} does not exist. Creating default directory.")
        data_dir.mkdir(parents=True, exist_ok=True)
        return docs

    for path in data_dir.glob("*.md"):
        try:
            loader = TextLoader(str(path), encoding="utf-8")
            loaded = loader.load()
            for d in loaded:
                d.metadata["source"] = path.name
                # Extract primary title/section if possible
                d.metadata["category"] = path.stem.replace("_", " ").title()
            docs.extend(loaded)
        except Exception as e:
            print(f"Error loading {path}: {e}")
    return docs

def ingest_data(chunk_size: int = 500, chunk_overlap: int = 100, persist_dir: str = None):
    """
    Ingest, split, and embed documents into ChromaDB.
    """
    if persist_dir is None:
        persist_dir = settings.CHROMA_DB_PATH

    print(f"Starting ingestion process. Chunk Size: {chunk_size}, Overlap: {chunk_overlap}")
    print(f"Vector Database Target Path: '{persist_dir}'")
    
    # Rebuild database by deleting the existing directory
    if os.path.exists(persist_dir):
        print(f"Deleting existing vector database at {persist_dir} for a clean rebuild...")
        shutil.rmtree(persist_dir)
        
    docs = load_documents(settings.DATA_DIR)
    if not docs:
        print("No documents found to ingest. Please place markdown documents under the 'data' directory.")
        return

    print(f"Loaded {len(docs)} document source files.")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n## ", "\n- ", "\n", " ", ""],
    )
    chunks = splitter.split_documents(docs)
    print(f"Created {len(chunks)} text chunks.")

    print("Initializing embeddings engine...")
    embeddings = get_embeddings_model()

    print("Building and persisting Chroma DB...")
    db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=persist_dir
    )
    
    print("Ingestion pipeline successfully completed!")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingest documents into ChromaDB Vector Store")
    parser.add_argument("--chunk-size", type=int, default=500, help="Size of document chunks")
    parser.add_argument("--overlap", type=int, default=100, help="Overlap between chunks")
    parser.add_argument("--db-path", type=str, default=None, help="Custom persist path for testing/evaluation")
    args = parser.parse_args()

    ingest_data(chunk_size=args.chunk_size, chunk_overlap=args.overlap, persist_dir=args.db_path)
