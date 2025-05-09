// components/AILawyerSearch.tsx
"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { useTheme } from "next-themes";
// import { useRouter } from "next/navigation";
// import { useUser } from "@clerk/nextjs";

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

interface AILawyerSearchProps {
    onSearchChange?: (term: string) => void;
    onAISearch?: (results: Lawyer[]) => void;
}

export default function AILawyerSearch({ onSearchChange, onAISearch }: AILawyerSearchProps) {
  // const { theme } = useTheme();
  // const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // const router = useRouter();
  // const { isSignedIn } = useUser();

  // useEffect(() => {
  //   setMounted(true);
  // }, []);

  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchTerm);
    }
  }, [searchTerm, onSearchChange]);


  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/lawyers/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchTerm }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      if (onAISearch) {
        onAISearch(data);
      }
      
    } catch (error) {
      console.error("Error searching for lawyers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // const handleSelectLawyer = (lawyerId: string) => {
  //   if (!isSignedIn) {
  //     router.push("/sign-in");
  //     return;
  //   }
    
  //   // Navigate to the lawyer's profile or start a chat
  //   router.push(`/lawyer-chat/${lawyerId}`);
  // };

  // const isDark = mounted && theme === "dark";

  return (
    <div className="relative z-10">
      <div className="flex items-center">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Describe your legal issue or search for a lawyer..."
            className="pl-10 pr-24"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 bg-law-primary hover:bg-law-primary/90"
            onClick={handleSearch}
            disabled={isLoading}
          >
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* {showResults && searchResults.length > 0 && (
        <div
          className={`absolute w-full mt-1 rounded-md shadow-lg max-h-72 overflow-y-auto ${
            isDark ? "bg-gray-800" : "bg-white"
          }`}
        >
          {searchResults.slice(0, 5).map((lawyer) => (
            <div
              key={lawyer.id}
              className={`flex items-center p-3 cursor-pointer hover:${
                isDark ? "bg-gray-700" : "bg-gray-100"
              } border-b border-border/40`}
              onClick={() => handleSelectLawyer(lawyer.id)}
            >
              <div className="flex-shrink-0 mr-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {lawyer.avatar ? (
                   <Image
                   src={lawyer.avatar}
                   alt={lawyer.name}
                   width={40}  // Specify the width (10 * 4 = 40px)
                   height={40} // Specify the height (10 * 4 = 40px)
                   className="rounded-full"
                 />
                  ) : (
                    <span className="text-lg font-semibold">
                      {lawyer.name.charAt(0)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <div className="flex justify-between">
                  <h4 className="text-sm font-medium">{lawyer.name}</h4>
                  <span className="text-xs text-muted-foreground">
                    {lawyer.location}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-muted-foreground">
                    {lawyer.specialization}
                  </p>
                  <div className="flex items-center">
                    <span className="text-xs font-medium mr-1">
                      {lawyer.rating}★
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({lawyer.reviews})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {searchResults.length > 5 && (
            <div
              className={`p-2 text-center text-sm ${
                isDark ? "text-gray-300" : "text-gray-600"
              } hover:${isDark ? "bg-gray-700" : "bg-gray-100"} cursor-pointer`}
              onClick={() => {
                router.push("/connect");
                setShowResults(false);
              }}
            >
              View all {searchResults.length} results
            </div>
          )}
        </div>
      )} */}
    </div>
  );
}