// src/lib/api.ts

// Depending on environment - you might want to make this configurable
const API_BASE_URL = "https://justicehub-backend-bpvv.onrender.com/";

// Match the backend Pydantic models more closely
export interface DocumentMetadata {
  chunk_id: number;
  chunk_size: number;
}

export interface SearchResult {
  content: string;
  similarity: number;
  metadata?: DocumentMetadata;  // Optional metadata from backend
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface NamedEntity {
  type: string;
  name: string;
}

export interface PotentialIssue {
  type: string;
  term: string;
  context: string;
}

export interface ClauseAnalysis {
  type: string;
  term: string;
  context?: string;
}

export interface LegalAnalysisResult {
  document_name: string;
  potential_issues: PotentialIssue[];
  named_entities: NamedEntity[];
  clause_analysis: ClauseAnalysis[];
}

export interface UploadResponse {
  message: string;
  chunk_count: number;
  analysis: LegalAnalysisResult[];
}

export interface ApiStatus {
  documents_processed: boolean;
  ready_for_search: boolean;
  model_loaded: boolean;
  model_name: string;
}

export interface LegalAnalysis {
  relevant_clauses: LegalAnalysisResult;
  suggested_answer: string;
}

export interface LegalQueryResponse {
  query: string;
  context: string[];
  analysis: LegalAnalysis;
}

/**
 * Upload PDF documents to the server for processing
 */
export const uploadDocuments = async (files: File[]): Promise<UploadResponse> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append("files", file);
  });

  const response = await fetch(`${API_BASE_URL}/upload-documents/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to upload documents");
  }

  return response.json();
};

/**
 * Search for relevant content within processed documents
 */
export const searchDocuments = async (query: string): Promise<SearchResponse> => {
  const response = await fetch(`${API_BASE_URL}/search/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to search documents");
  }

  return response.json();
};

/**
 * Submit a legal query which returns context documents and analysis
 */
export const submitLegalQuery = async (
  query: string, 
  contextSize: number = 3
): Promise<LegalQueryResponse> => {
  const formData = new FormData();
  formData.append("query", query);
  formData.append("context_size", contextSize.toString());

  const response = await fetch(`${API_BASE_URL}/legal-query/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || "Failed to process legal query");
  }

  return response.json();
};

/**
 * Check the status of the API and whether documents are ready
 */
export const checkStatus = async (): Promise<ApiStatus> => {
  const response = await fetch(`${API_BASE_URL}/status/`);
  
  if (!response.ok) {
    throw new Error("Failed to check API status");
  }

  return response.json();
};