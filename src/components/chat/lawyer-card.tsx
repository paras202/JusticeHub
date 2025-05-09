// components/chat/lawyer-card.tsx
"use client";

import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star, MapPin, Briefcase, DollarSign, Clock } from "lucide-react";

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

interface LawyerCardProps {
  lawyer: Lawyer;
}

export function LawyerCard({ lawyer }: LawyerCardProps) {
  const router = useRouter();
  const { isSignedIn } = useUser();

  const handleConnect = () => {
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    
    // Navigate to the lawyer's chat
    router.push(`/lawyer-chat/${lawyer.id}`);
  };

  return (
    <Card className="mb-3 overflow-hidden border border-gray-200 dark:border-gray-800">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="h-14 w-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              {lawyer.avatar ? (
                <Image
                  src={lawyer.avatar}
                  alt={lawyer.name}
                  width={56}
                  height={56}
                  className="rounded-full"
                />
              ) : (
                <span className="text-xl font-semibold">
                  {lawyer.name.charAt(0)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex justify-between">
              <h3 className="font-medium text-lg">{lawyer.name}</h3>
              <div className="flex items-center text-amber-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="ml-1 text-sm font-medium">{lawyer.rating}</span>
                <span className="text-xs text-muted-foreground ml-1">({lawyer.reviews})</span>
              </div>
            </div>
            
            <p className="text-sm font-medium text-muted-foreground">{lawyer.specialization}</p>
            
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2">
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1" />
                <span>{lawyer.location}</span>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <Briefcase className="h-3 w-3 mr-1" />
                <span>{lawyer.experience} years</span>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground">
                <DollarSign className="h-3 w-3 mr-1" />
                <span>{lawyer.hourlyRate}</span>
              </div>
              
              <div className="flex items-center text-sm">
                {lawyer.availableNow ? (
                  <span className="flex items-center text-green-600 dark:text-green-500">
                    <Clock className="h-3 w-3 mr-1" />
                    Available now
                  </span>
                ) : (
                  <span className="flex items-center text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    Not available
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Expertise:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {lawyer.expertise.slice(0, 3).map((item, index) => (
                  <span
                    key={index}
                    className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800"
                  >
                    {item}
                  </span>
                ))}
                {lawyer.expertise.length > 3 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800">
                    +{lawyer.expertise.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-end">
        <Button
          onClick={handleConnect}
          className="bg-law-primary hover:bg-law-primary/90 text-white"
          size="sm"
        >
          Connect Now
        </Button>
      </CardFooter>
    </Card>
  );
}