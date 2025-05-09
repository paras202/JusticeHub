"use client";

import { useState } from "react";
import AILawyerSearch from "@/components/lawyer/AILawyerSearch";
import { LawyerResults } from "@/components/chat/lawyer-results";

type Lawyer = {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  experience: number | string;
  location: string;
  rating: number;
  reviews: number;
  hourlyRate: string;
  expertise: string[];
  availableNow: boolean;
};

interface ChatWithLawyerSearchProps {
  onChatStart?: (message: string) => void;
}

export function ChatWithLawyerSearch({ onChatStart }: ChatWithLawyerSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [lawyerResults, setLawyerResults] = useState<Lawyer[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleAISearch = (results: Lawyer[]) => {
    setLawyerResults(results);
    setShowResults(true);
    
    // If there's a chat start handler, pass the search term as the initial message
    if (onChatStart && searchTerm.trim()) {
      onChatStart(searchTerm);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="mb-4">
        <AILawyerSearch 
          onSearchChange={handleSearchChange}
          onAISearch={handleAISearch}
        />
      </div>
      
      {showResults && lawyerResults.length > 0 && (
        <LawyerResults lawyers={lawyerResults} />
      )}
    </div>
  );
}