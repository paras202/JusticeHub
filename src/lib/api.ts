// src/lib/api.ts
const API_BASE_URL = "http://localhost:8000";

export interface SearchResult {
  content: string;
  similarity: number;
}

export interface SearchResponse {
  results: SearchResult[];
}

export const uploadDocuments = async (files: File[]): Promise<{ message: string; chunk_count: number }> => {
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

export const checkStatus = async (): Promise<{ documents_processed: boolean; ready_for_search: boolean }> => {
  const response = await fetch(`${API_BASE_URL}/status/`);
  
  if (!response.ok) {
    throw new Error("Failed to check API status");
  }

  return response.json();
};