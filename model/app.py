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

app = FastAPI(title="Indian Legal Document Analysis API")

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
instructor_model = None

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
    constitutional_references: List[Dict[str, Any]]
    fundamental_rights: List[Dict[str, Any]]
    directive_principles: List[Dict[str, Any]]

class AnalysisResponse(BaseModel):
    results: List[LegalAnalysisResult]

# Enhanced Legal patterns for analysis including Indian Constitution specific terms
LEGAL_PATTERNS = {
    "ambiguous_terms": [
        r"\b(?:reasonable|adequate|appropriate|substantial|material)\b",
        r"\b(?:good faith|best efforts|commercially reasonable efforts)\b",
        r"\b(?:fair and equitable|just and proper|as may be prescribed)\b",
        r"\b(?:public interest|national interest|interest of sovereignty)\b"
    ],
    "defined_terms": [
        r'"([^"]+)"(?:\s+|\s*,\s*)(?:means|shall mean|refers to)',
        r'the term "([^"]+)"(?:\s+|\s*,\s*)(?:means|shall mean|refers to)',
        r'(?:hereinafter|hereafter) (?:referred to as|called) (?:the|an?)? "([^"]+)"'
    ],
    "obligations": [
        r"\b(?:shall|must|is required to|agrees to|undertakes to|obligated to)\b",
        r"\b(?:is duty bound to|is bound by law to|as mandated by)\b"
    ],
    "dates": [
        r"\b(?:on or before|on or after|not later than|prior to|following)\b",
        r"\b(?:with effect from|w\.e\.f\.|subject to extension|unless extended)\b"
    ],
    # Indian Constitution specific patterns
    "constitutional_articles": [
        r"\bArticle (\d+)(?:\([A-Za-z0-9]+\))?(?:\s+of the Constitution)?\b",
        r"\bSchedule (\d+|[IV]{1,3})(?:\s+of the Constitution)?\b",
        r"\bPart (\d+|[IV]{1,3})(?:\s+of the Constitution)?\b"
    ],
    "fundamental_rights": [
        r"\b(?:right to equality|equality before law|equal protection)\b",
        r"\b(?:right to freedom|freedom of speech|freedom of expression)\b",
        r"\b(?:right against exploitation|prohibition of trafficking|forced labor)\b",
        r"\b(?:right to freedom of religion|freedom to practice religion)\b",
        r"\b(?:cultural and educational rights|rights of minorities)\b",
        r"\b(?:right to constitutional remedies|writ jurisdiction)\b"
    ],
    "directive_principles": [
        r"\b(?:welfare state|social order|economic justice|distributive justice)\b",
        r"\b(?:equal pay for equal work|living wage|humane conditions of work)\b",
        r"\b(?:participation of workers|uniform civil code|village panchayat)\b"
    ],
    "legal_citations": [
        r"\b(\d{4})\s+SCC\s+(\d+)\b",  # SCC citations
        r"\b(AIR)\s+(\d{4})\s+SC\s+(\d+)\b",  # AIR citations
        r"\b(\d{4})\s+SCR\s+(\d+)\b",  # SCR citations
    ],
    "indian_legal_terms": [
        r"\b(?:writ of mandamus|writ of habeas corpus|writ of certiorari|writ of prohibition|writ of quo warranto)\b",
        r"\b(?:suo motu|locus standi|res judicata|audi alteram partem|ultra vires)\b",
        r"\b(?:cognizable offense|non-cognizable offense|bailable offense|non-bailable offense)\b"
    ]
}

# Dictionary of Indian Constitution Articles and their subjects
CONSTITUTION_ARTICLES = {
    "12-35": "Fundamental Rights",
    "36-51": "Directive Principles of State Policy",
    "51A": "Fundamental Duties",
    "52-78": "The Union Executive",
    "79-122": "Parliament",
    "123-151": "Legislative Powers of President and Governor",
    "152-237": "The States",
    "243-243ZH": "Panchayats and Municipalities",
    "244-244A": "Scheduled and Tribal Areas",
    "245-263": "Relations between Union and States",
    "264-300A": "Finance, Property, Contracts and Suits",
    "301-307": "Trade and Commerce",
    "308-323": "Services under Union and States",
    "324-329A": "Elections",
    "330-342": "Special Provisions for SC/ST/OBC",
    "343-351": "Official Language",
    "352-360": "Emergency Provisions",
    "361-367": "Miscellaneous Provisions",
    "368": "Amendment of Constitution",
    "369-392": "Temporary, Transitional and Special Provisions",
    "393-395": "Short Title, Commencement and Repeals"
}

class CustomInstructorEmbeddings(Embeddings):
    def __init__(self, model_name=MODEL_NAME):
        self.model = SentenceTransformer(model_name)
        self.embed_instruction = "Represent the Indian legal document for retrieval:"
        self.query_instruction = "Represent the Indian legal query for retrieval:"
        
    def embed_documents(self, texts):
        instructions = [[self.embed_instruction, text] for text in texts]
        embeddings = self.model.encode(instructions)
        return embeddings.tolist()
    
    def embed_query(self, text):
        instruction = [[self.query_instruction, text]]
        embedding = self.model.encode(instruction)
        flat_embedding = embedding[0].tolist()
        logger.debug(f"Query embedding length: {len(flat_embedding)}")
        return flat_embedding

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
    Enhanced regex-based extraction of potential named entities in legal documents.
    In a production system, you might want to use a proper NER model.
    """
    # Entity patterns for Indian legal context
    company_pattern = r"(?:[A-Z][a-z]* )*(?:LLC|Inc\.|Corporation|Corp\.|Ltd\.|Pvt\.|Private Limited|Public Limited|LLP)"
    person_pattern = r"[A-Z][a-z]+ (?:[A-Z][a-z]*\. )?[A-Z][a-z]+"
    govt_bodies = r"(?:Ministry of|Department of|Government of|Supreme Court|High Court of|District Court of|Tribunal|Authority|Commission|Board)"
    
    companies = re.findall(company_pattern, text)
    persons = re.findall(person_pattern, text)
    bodies = re.findall(govt_bodies, text)
    
    return {
        "companies": list(set(companies)),
        "persons": list(set(persons)),
        "government_bodies": list(set(bodies))
    }

def identify_article_subject(article_num):
    """Identify the subject area of an Indian Constitution article"""
    try:
        article_num = int(article_num)
        for range_str, subject in CONSTITUTION_ARTICLES.items():
            if "-" in range_str:
                start, end = map(int, range_str.split("-"))
                if start <= article_num <= end:
                    return subject
            elif "A" in range_str:
                # Handle special cases like 51A
                base = int(range_str.replace("A", ""))
                if article_num == base:
                    return subject + " (Main)"
                if article_num == int(range_str.replace("A", "")):
                    return subject
            else:
                if article_num == int(range_str):
                    return subject
    except:
        pass
    
    return "Unknown subject area"

def analyze_legal_text(text, doc_name):
    """Analyze legal text for potential issues, named entities, clauses, and Indian constitutional references"""
    analysis = {
        "document_name": doc_name,
        "potential_issues": [],
        "named_entities": [],
        "clause_analysis": [],
        "constitutional_references": [],
        "fundamental_rights": [],
        "directive_principles": []
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
            
    # Extract constitutional articles references
    for pattern in LEGAL_PATTERNS["constitutional_articles"]:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            if match.groups():
                article_num = match.group(1)
                context_start = max(0, match.start() - 100)
                context_end = min(len(text), match.end() + 100)
                context = text[context_start:context_end]
                
                subject = identify_article_subject(article_num)
                
                analysis["constitutional_references"].append({
                    "type": "constitutional_article",
                    "article": article_num,
                    "subject": subject,
                    "context": context
                })
    
    # Extract fundamental rights references
    for pattern in LEGAL_PATTERNS["fundamental_rights"]:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 100)
            context = text[context_start:context_end]
            
            analysis["fundamental_rights"].append({
                "type": "fundamental_right",
                "right": match.group(0),
                "context": context
            })
    
    # Extract directive principles references
    for pattern in LEGAL_PATTERNS["directive_principles"]:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 100)
            context = text[context_start:context_end]
            
            analysis["directive_principles"].append({
                "type": "directive_principle",
                "principle": match.group(0),
                "context": context
            })
            
    # Extract legal citations (Indian cases)
    for pattern in LEGAL_PATTERNS["legal_citations"]:
        matches = re.finditer(pattern, text)
        for match in matches:
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 100)
            context = text[context_start:context_end]
            
            analysis["constitutional_references"].append({
                "type": "legal_citation",
                "citation": match.group(0),
                "context": context
            })
            
    # Extract Indian legal terms
    for pattern in LEGAL_PATTERNS["indian_legal_terms"]:
        matches = re.finditer(pattern, text, re.IGNORECASE)
        for match in matches:
            context_start = max(0, match.start() - 100)
            context_end = min(len(text), match.end() + 100)
            context = text[context_start:context_end]
            
            analysis["clause_analysis"].append({
                "type": "indian_legal_term",
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
    Enhanced legal query endpoint that uses context from documents and specialized legal analysis
    with focus on Indian Constitution and legal system.
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
        analysis = analyze_legal_text(context_text, "Retrieved Context")
        
        # Enhance analysis with Indian legal context
        # Look for constitutional references in the query
        constitution_mentions = []
        for pattern in LEGAL_PATTERNS["constitutional_articles"]:
            matches = re.finditer(pattern, query, re.IGNORECASE)
            for match in matches:
                if match.groups():
                    article_num = match.group(1)
                    subject = identify_article_subject(article_num)
                    constitution_mentions.append({
                        "article": article_num,
                        "subject": subject
                    })
        
        response = {
            "query": query,
            "context": [doc.page_content for doc in context_documents],
            "constitutional_references_in_query": constitution_mentions,
            "analysis": {
                "potential_issues": analysis["potential_issues"],
                "constitutional_references": analysis["constitutional_references"],
                "fundamental_rights": analysis["fundamental_rights"],
                "directive_principles": analysis["directive_principles"],
                "suggested_answer": "This would be answered by a language model in a complete implementation."
            }
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error in legal query endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing legal query: {str(e)}")

@app.post("/constitutional-analysis/")
async def constitutional_analysis_endpoint(
    document_text: str = Form(..., description="Text content for constitutional analysis")
):
    """
    Specialized endpoint for analyzing text against the Indian Constitution.
    """
    try:
        # Perform focused constitutional analysis
        analysis = analyze_legal_text(document_text, "Constitutional Analysis")
        
        # Filter for constitutional elements only
        constitutional_analysis = {
            "constitutional_references": analysis["constitutional_references"],
            "fundamental_rights": analysis["fundamental_rights"],
            "directive_principles": analysis["directive_principles"],
            "potential_constitutional_issues": [
                issue for issue in analysis["potential_issues"] 
                if any(term in issue["context"].lower() for term in 
                      ["constitution", "article", "fundamental", "right", "directive", "amendment"])
            ]
        }
        
        # Count references by category
        summary = {
            "total_constitutional_references": len(analysis["constitutional_references"]),
            "total_fundamental_rights": len(analysis["fundamental_rights"]),
            "total_directive_principles": len(analysis["directive_principles"]),
            "articles_referenced": list(set([ref["article"] for ref in analysis["constitutional_references"] 
                                          if "article" in ref]))
        }
        
        return {
            "summary": summary,
            "analysis": constitutional_analysis
        }
        
    except Exception as e:
        logger.error(f"Error in constitutional analysis endpoint: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Error processing constitutional analysis: {str(e)}")

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