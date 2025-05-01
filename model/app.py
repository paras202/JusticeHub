import os
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "true"
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from huggingface_hub import login
login(token="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")
print("Successfully logged in to Hugging Face")

import tempfile
import uvicorn
import torch
import numpy as np
import logging
import traceback
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import pdfplumber
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from langchain.embeddings.base import Embeddings
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI(title="Legal Document Analysis API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow all origins for testing - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants
VECTOR_DB_DIR = "vector_db"
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
MODEL_SIZE = os.environ.get("INSTRUCTOR_MODEL_SIZE", "base")  # base, large, or xl
MODEL_NAME = f"hkunlp/instructor-{MODEL_SIZE}"

# Global variables
vector_store = None

# Base models for API responses
class SearchQuery(BaseModel):
    query: str

class SearchResult(BaseModel):
    content: str
    similarity: float
    metadata: Optional[Dict[str, Any]] = None

class SearchResponse(BaseModel):
    results: List[SearchResult]

class LegalAnalysisResult(BaseModel):
    document_name: str
    potential_issues: List[Dict[str, Any]]
    named_entities: List[Dict[str, Any]]
    clause_analysis: List[Dict[str, Any]]

class AnalysisResponse(BaseModel):
    results: List[LegalAnalysisResult]

# Legal patterns for analysis
LEGAL_PATTERNS = {
    "ambiguous_terms": [
        r"\b(?:reasonable|adequate|appropriate|substantial|material)\b",
        r"\b(?:good faith|best efforts|commercially reasonable efforts)\b"
    ],
    "defined_terms": [
        r'"([^"]+)"(?:\s+|\s*,\s*)(?:means|shall mean|refers to)',
        r'the term "([^"]+)"(?:\s+|\s*,\s*)(?:means|shall mean|refers to)'
    ],
    "obligations": [
        r"\b(?:shall|must|is required to|agrees to|undertakes to)\b",
    ],
    "dates": [
        r"\b(?:on or before|on or after|not later than|prior to|following)\b",
    ]
}

class CustomInstructorEmbeddings(Embeddings):
    def __init__(self, model_name=MODEL_NAME):
        self.model = SentenceTransformer(model_name)
        self.embed_instruction = "Represent the legal document for retrieval:"
        self.query_instruction = "Represent the legal query for retrieval:"
        
    def embed_documents(self, texts):
        instructions = [[self.embed_instruction, text] for text in texts]
        embeddings = self.model.encode(instructions)
        return embeddings.tolist()
    
    def embed_query(self, text):
        instruction = [[self.query_instruction, text]]
        embedding = self.model.encode(instruction)
        return embedding.tolist()

# Cache the model to avoid reloading
instructor_model = None

def get_instructor_model():
    global instructor_model
    if instructor_model is None:
        logger.info(f"Loading INSTRUCTOR model: {MODEL_NAME}")
        try:
            instructor_model = CustomInstructorEmbeddings(model_name=MODEL_NAME)
            logger.info("INSTRUCTOR model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading INSTRUCTOR model: {str(e)}")
            logger.error(traceback.format_exc())
            raise RuntimeError(f"Failed to load INSTRUCTOR model: {str(e)}")
    return instructor_model

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    global vector_store
    try:
        if os.path.exists(VECTOR_DB_DIR):
            model = get_instructor_model()
            vector_store = FAISS.load_local(VECTOR_DB_DIR, model, allow_dangerous_deserialization=True)
            logger.info("Vector store loaded from disk")
    except Exception as e:
        logger.error(f"Could not load vector store: {str(e)}")
        logger.error(traceback.format_exc())

    yield  # App runs here

def extract_named_entities(text):
    """
    Simple regex-based extraction of potential named entities in legal documents.
    In a production system, you might want to use a proper NER model.
    """
    # Simple patterns for company names, person names, and locations
    company_pattern = r"(?:[A-Z][a-z]* )*(?:LLC|Inc\.|Corporation|Corp\.|Ltd\.)"
    person_pattern = r"[A-Z][a-z]+ (?:[A-Z][a-z]*\. )?[A-Z][a-z]+"
    
    companies = re.findall(company_pattern, text)
    persons = re.findall(person_pattern, text)
    
    return {
        "companies": list(set(companies)),
        "persons": list(set(persons))
    }

def analyze_legal_text(text, doc_name):
    """Analyze legal text for potential issues, named entities, and clauses"""
    analysis = {
        "document_name": doc_name,
        "potential_issues": [],
        "named_entities": [],
        "clause_analysis": []
    }

    # Check for ambiguous terms
    for pattern in LEGAL_PATTERNS["ambiguous_terms"]:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            context_start = max(0, match.start() - 50)
            context_end = min(len(text), match.end() + 50)
            context = text[context_start:context_end]
            
            analysis["potential_issues"].append({
                "type": "ambiguous_term",
                "term": match.group(0),
                "context": context
            })

    # Extract defined terms
    for pattern in LEGAL_PATTERNS["defined_terms"]:
        matches = re.finditer(pattern, text, re.IGNORECASE) 
        for match in matches:
            if match.groups():
                defined_term = match.group(1)
                analysis["clause_analysis"].append({
                    "type": "defined_term",
                    "term": defined_term
                })

    # Extract named entities
    entities = extract_named_entities(text)
    for entity_type, entity_list in entities.items():
        for entity in entity_list:
            analysis["named_entities"].append({
                "type": entity_type,
                "name": entity
            })

    # Analyze obligations
    for pattern in LEGAL_PATTERNS["obligations"]:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 100)
            context = text[context_start:context_end]
            
            analysis["clause_analysis"].append({
                "type": "obligation",
                "term": match.group(0),
                "context": context
            })

    return analysis

@app.post("/upload-documents/")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload and process PDF documents for search and analysis.
    """
    global vector_store
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    logger.info(f"Received {len(files)} files for processing")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            file_paths = []
            file_names = []
            
            for file in files:
                if not file.filename.lower().endswith('.pdf'):
                    logger.warning(f"Non-PDF file received: {file.filename}")
                    raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF file")
                
                file_path = os.path.join(temp_dir, file.filename)
                file_names.append(file.filename)
                logger.info(f"Saving uploaded file to: {file_path}")
                
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                
                # Verify the file was saved correctly
                if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
                    logger.error(f"Failed to save file or file is empty: {file.filename}")
                    raise HTTPException(status_code=400, detail=f"Failed to process {file.filename}")
                
                logger.info(f"Successfully saved file: {file.filename} ({os.path.getsize(file_path)} bytes)")
                file_paths.append(file_path)
            
            try:
                raw_text = get_pdf_text(file_paths)
                logger.info(f"Successfully extracted text from PDFs: {len(raw_text)} characters")
                
                # Perform legal analysis on the raw text
                analysis_results = []
                for i, file_name in enumerate(file_names):
                    analysis = analyze_legal_text(raw_text, file_name)
                    analysis_results.append(analysis)
                
                text_chunks = get_text_chunks(raw_text)
                logger.info(f"Successfully created {len(text_chunks)} text chunks")
                
                try:
                    vector_store = get_text_embeddings(text_chunks)
                    logger.info("Successfully created vector store")
                    
                    return JSONResponse(
                        status_code=200,
                        content={
                            "message": "Documents processed successfully", 
                            "chunk_count": len(text_chunks),
                            "analysis": analysis_results
                        }
                    )
                except Exception as e:
                    logger.error(f"Error creating embeddings: {str(e)}")
                    logger.error(traceback.format_exc())
                    raise HTTPException(status_code=500, detail=f"Error creating embeddings: {str(e)}")
                
            except ValueError as e:
                logger.error(f"Validation error processing text: {str(e)}")
                raise HTTPException(status_code=400, detail=str(e))
            except Exception as e:
                logger.error(f"Error processing text: {str(e)}")
                logger.error(traceback.format_exc())
                raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")
    except Exception as e:
        logger.error(f"Outer exception: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/search/", response_model=SearchResponse)
async def search_documents_endpoint(search_query: SearchQuery):
    global vector_store
    
    if not vector_store:
        raise HTTPException(status_code=400, detail="No documents processed yet")
    
    try:
        model = get_instructor_model()
        # --- Changed: embed query as 2D float32 array for FAISS ---
        q_emb_list = model.embed_query(search_query.query)
        q_emb = np.array(q_emb_list, dtype=np.float32).reshape(1, -1)

        # --- Changed: use low-level FAISS index search to avoid unpack errors ---
        distances, indices = vector_store.index.search(q_emb, k=5)

       # Gather corresponding documents 
        docs = []
        for i in indices[0]:
            if i == -1:
                logger.warning("No matching document found for a query result slot.")
                continue
            doc_id = vector_store.index_to_docstore_id[i]
            doc = vector_store.docstore.search(doc_id)
            docs.append(doc)

        # Compute cosine similarities for user-facing scores
        results = []
        for doc in docs:
            doc_emb = model.embed_documents([doc.page_content])[0]
            sim = float(
                np.dot(q_emb_list, doc_emb)
                / (np.linalg.norm(q_emb_list) * np.linalg.norm(doc_emb))
            )
            results.append(SearchResult(content=doc.page_content, similarity=sim))

        return SearchResponse(results=results)

    except Exception as e:
        logger.error(f"Search error: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Search failed")

@app.post("/legal-query/")
async def legal_query_endpoint(
    query: str = Form(...),
    context_size: int = Query(3, description="Number of context documents to retrieve")
):
    """
    Enhanced legal query endpoint that uses context from documents and specialized legal analysis.
    """
    global vector_store
    
    try:
        context_documents = []
        if not vector_store:
            raise HTTPException(status_code=400, detail="No documents processed yet")
            
        try:
            # Search for relevant context
            context_documents = vector_store.similarity_search(query, k=context_size)
        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
        
        # Prepare a response with the context from retrieved documents
        context_text = "\n\n".join([doc.page_content for doc in context_documents])
        
        # Analyze the legal question based on the retrieved context
        # Here we would normally use a more sophisticated approach like a pre-trained LLM
        # But for this example, we'll return a basic response with the context
        
        response = {
            "query": query,
            "context": [doc.page_content for doc in context_documents],
            "analysis": {
                "relevant_clauses": analyze_legal_text(context_text, "Retrieved Context"),
                "suggested_answer": "This would be answered by a language model in a complete implementation."
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in legal query endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing legal query: {str(e)}")

@app.get("/status/")
async def get_status():
    """
    Check if documents have been processed and are ready for search.
    """
    global vector_store
    
    return {
        "documents_processed": vector_store is not None,
        "ready_for_search": vector_store is not None,
        "model_loaded": instructor_model is not None,
        "model_name": MODEL_NAME
    }

def get_pdf_text(pdf_paths):
    """Extract text from PDF files with better error handling."""
    logger.info(f"Processing {len(pdf_paths)} PDF files")
    text = ""
    
    for pdf_path in pdf_paths:
        try:
            logger.info(f"Reading PDF: {os.path.basename(pdf_path)}")
            with pdfplumber.open(pdf_path) as pdf_reader:
                if len(pdf_reader.pages) == 0:
                    logger.warning(f"PDF file has no pages: {os.path.basename(pdf_path)}")
                    continue
                    
                logger.info(f"PDF has {len(pdf_reader.pages)} pages")
                
                for i, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if not page_text:
                            logger.warning(f"Empty text extracted from page {i+1} in {os.path.basename(pdf_path)}")
                        text += page_text or ""
                    except Exception as e:
                        logger.error(f"Error extracting text from page {i+1} in {os.path.basename(pdf_path)}: {str(e)}")
        except Exception as e:
            logger.error(f"Error processing PDF {os.path.basename(pdf_path)}: {str(e)}")
            
    if not text.strip():
        raise ValueError("No text was extracted from any of the PDF files")
        
    logger.info(f"Successfully extracted {len(text)} characters of text from PDFs")
    return text

def get_text_chunks(text):
    """Split text into chunks with better error handling."""
    if not text or not text.strip():
        raise ValueError("Empty text provided for chunking")
    
    logger.info(f"Splitting text of length {len(text)} into chunks")
    
    try:
        splitter = CharacterTextSplitter(
            separator="\n",
            chunk_size=CHUNK_SIZE,
            chunk_overlap=CHUNK_OVERLAP,
            length_function=len
        )
        chunks = splitter.split_text(text)
        
        if not chunks:
            raise ValueError("Text splitting resulted in zero chunks")
            
        logger.info(f"Successfully split text into {len(chunks)} chunks")
        return chunks
    except Exception as e:
        logger.error(f"Error during text chunking: {str(e)}")
        logger.error(traceback.format_exc())
        raise

def get_text_embeddings(text_chunks):
    """Create embeddings and vector store using the INSTRUCTOR model."""
    if not text_chunks:
        raise ValueError("No text chunks provided for embedding")
        
    logger.info(f"Creating embeddings for {len(text_chunks)} text chunks")
    
    try:
        model = get_instructor_model()
        
        # Create vector store with document metadata
        chunk_metadata = [{"chunk_id": i, "chunk_size": len(chunk)} for i, chunk in enumerate(text_chunks)]
        
        vector_store = FAISS.from_texts(
            texts=text_chunks,
            embedding=model,
            metadatas=chunk_metadata
        )
        
        # Save to disk to persist across restarts
        logger.info("Saving vector store to disk")
        vector_store.save_local(VECTOR_DB_DIR)
        
        logger.info(f"Successfully created vector store")
        return vector_store
        
    except Exception as e:
        logger.error(f"Error creating embeddings: {str(e)}")
        logger.error(traceback.format_exc())
        
        # If using CUDA and encounter an OOM error, try to free memory
        if torch.cuda.is_available():
            logger.info("Attempting to free CUDA memory")
            torch.cuda.empty_cache()
        
        raise

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)