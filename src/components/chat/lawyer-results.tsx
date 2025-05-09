// components/chat/lawyer-results.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LawyerCard } from "@/components/chat/lawyer-card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

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

interface LawyerResultsProps {
  lawyers: Lawyer[];
}

export function LawyerResults({ lawyers }: LawyerResultsProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  
  // Display only first 2 lawyers by default
  const visibleLawyers = expanded ? lawyers : lawyers.slice(0, 2);
  const hasMoreLawyers = lawyers.length > 2;

  const handleViewAll = () => {
    router.push("/lawyer-connect");
  };

  return (
    <div className="my-4 space-y-3">
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 mb-3">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Based on your query, I&apos;ve found {lawyers.length} legal professionals who might be able to help you:
        </p>
      </div>
      
      {visibleLawyers.map((lawyer) => (
        <LawyerCard key={lawyer.id} lawyer={lawyer} />
      ))}
      
      {hasMoreLawyers && (
        <div className="flex justify-center gap-3">
          {!expanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1"
            >
              <ChevronDown className="h-4 w-4" />
              <span>Show {lawyers.length - 2} more</span>
            </Button>
          )}
          
          {expanded && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(false)}
              className="flex items-center gap-1"
            >
              <ChevronUp className="h-4 w-4" />
              <span>Show less</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewAll}
            className="text-law-primary hover:text-law-primary/90"
          >
            View all lawyers
          </Button>
        </div>
      )}
      
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-md p-3 mt-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Would you like me to help you understand more about your legal situation before connecting with a lawyer?
        </p>
      </div>
    </div>
  );
}