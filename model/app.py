import os
import tempfile
import uvicorn
import torch
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
from PyPDF2 import PdfReader
from langchain.text_splitter import CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from InstructorEmbedding import INSTRUCTOR
from langchain_community.embeddings import HuggingFaceInstructEmbeddings

app = FastAPI(title="Legal Document Search API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vector_store = None

class SearchQuery(BaseModel):
    query: str

class SearchResult(BaseModel):
    content: str
    similarity: float

class SearchResponse(BaseModel):
    results: List[SearchResult]

def get_device():
    return "cuda" if torch.cuda.is_available() else "cpu"

@app.on_event("startup")
async def startup_event():
    global vector_store
    try:
        if os.path.exists("vector_db"):
            device = get_device()
            embeddings = HuggingFaceInstructEmbeddings(
                model_name="hkunlp/instructor-xl",
                instruction="Represent the legal document for retrieval:",
                device=device
            )
            vector_store = FAISS.load_local("vector_db", embeddings)
            print("Vector store loaded from disk")
    except Exception as e:
        print(f"Could not load vector store: {e}")

@app.post("/upload-documents/")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload and process PDF documents for search.
    """
    global vector_store
    
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    try:
        with tempfile.TemporaryDirectory() as temp_dir:
            pdf_paths = []
            
            for file in files:
                if not file.filename.lower().endswith('.pdf'):
                    raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF file")
                
                file_path = os.path.join(temp_dir, file.filename)
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(file.file, buffer)
                pdf_paths.append(file_path)
            
            try:
                raw_text = get_pdf_text(pdf_paths)
                text_chunks = get_text_chunks(raw_text)
                
                try:
                    vector_store = get_text_embeddings(text_chunks)
                    return JSONResponse(
                        status_code=200,
                        content={"message": "Documents processed successfully", "chunk_count": len(text_chunks)}
                    )
                except Exception as e:
                    print(f"Error creating embeddings: {str(e)}")
                    raise HTTPException(status_code=500, detail=f"Error creating embeddings: {str(e)}")
                
            except Exception as e:
                print(f"Error processing text: {str(e)}")
                raise HTTPException(status_code=500, detail=f"Error processing documents: {str(e)}")
    except Exception as e:
        print(f"Outer exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server error: {str(e)}")

@app.post("/search/", response_model=SearchResponse)
async def search_documents_endpoint(search_query: SearchQuery):
    """
    Search through processed documents with a query.
    """
    global vector_store
    
    if not vector_store:
        raise HTTPException(status_code=400, detail="No documents have been processed yet")
    
    try:
        results = search_documents(vector_store, search_query.query)
        
        return SearchResponse(
            results=[
                SearchResult(
                    content=doc.page_content,
                    similarity=doc.metadata.get("score", 0) if hasattr(doc, "metadata") else 0
                )
                for doc in results
            ]
        )
    except Exception as e:
        print(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error searching documents: {str(e)}")

@app.post("/chat/")
async def chat_endpoint(query: str = Form(...)):
    """
    Chat endpoint that uses context from documents.
    """
    global vector_store
    
    try:
        context_documents = []
        if vector_store:
            try:
                context_documents = search_documents(vector_store, query)
            except Exception as e:
                print(f"Error searching documents: {str(e)}")
        
        response = {
            "answer": "This is a placeholder response enhanced with context from your documents."
        }
        
        if context_documents:
            response["context"] = [doc.page_content for doc in context_documents]
        
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in chat endpoint: {str(e)}")

@app.get("/status/")
async def get_status():
    """
    Check if documents have been processed and are ready for search.
    """
    global vector_store
    
    return {
        "documents_processed": vector_store is not None,
        "ready_for_search": vector_store is not None
    }

def get_pdf_text(pdf_paths):
    text = ""
    for pdf_path in pdf_paths:
        pdf_reader = PdfReader(pdf_path)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def get_text_chunks(text):
    splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=120,
        length_function=len
    )
    return splitter.split_text(text)

def get_text_embeddings(text_chunks):
    # Using the HuggingFaceInstructEmbeddings wrapper for consistency
    device = get_device()
    embeddings = HuggingFaceInstructEmbeddings(
        model_name="hkunlp/instructor-xl",
        instruction="Represent the legal document for retrieval:",
        device=device
    )
    vector_store = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    
    # Save to disk to persist across restarts
    if not os.path.exists("vector_db"):
        os.makedirs("vector_db")
    vector_store.save_local("vector_db")
    
    return vector_store

def search_documents(vector_store, query, k=3):
    """Search for relevant documents using a query"""
    # Use the same embedding model as for indexing
    device = get_device()
    embeddings = HuggingFaceInstructEmbeddings(
        model_name="hkunlp/instructor-xl",
        instruction="Represent the legal query for retrieval:",
        device=device
    )
    query_embedding = embeddings.embed_query(query)
    docs = vector_store.similarity_search_by_vector(query_embedding, k=k)
    return docs

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)