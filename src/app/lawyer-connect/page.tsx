"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Scale, Search, Filter, MapPin, Clock, DollarSign, Star, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
// CardDescription, CardFooter, CardHeader, CardTitle,  ArrowUpDown,
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { UserButton } from "@clerk/nextjs"
import { useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

// // Mock data for lawyers
// const LAWYERS = [
//   {
//     id: "1",
//     name: "Adv. Priya Sharma",
//     avatar: "/api/placeholder/150/150",
//     specialization: "Family Law",
//     experience: "15 years",
//     location: "Delhi NCR",
//     rating: 4.8,
//     reviews: 127,
//     hourlyRate: "₹5,000",
//     expertise: ["Divorce", "Child Custody", "Alimony"],
//     availableNow: true
//   },
//   {
//     id: "2",
//     name: "Adv. Rajesh Kumar",
//     avatar: "/api/placeholder/150/150",
//     specialization: "Criminal Law",
//     experience: "12 years",
//     location: "Mumbai",
//     rating: 4.5,
//     reviews: 93,
//     hourlyRate: "₹4,500",
//     expertise: ["Criminal Defense", "Bail Applications", "Appeals"],
//     availableNow: false
//   },
//   {
//     id: "3",
//     name: "Adv. Sunita Patel",
//     avatar: "/api/placeholder/150/150",
//     specialization: "Corporate Law",
//     experience: "20 years",
//     location: "Bangalore",
//     rating: 4.9,
//     reviews: 215,
//     hourlyRate: "₹7,500",
//     expertise: ["Contracts", "Mergers & Acquisitions", "Corporate Governance"],
//     availableNow: true
//   },
//   {
//     id: "4",
//     name: "Adv. Vikram Singh",
//     avatar: "/api/placeholder/150/150",
//     specialization: "Property Law",
//     experience: "8 years",
//     location: "Chennai",
//     rating: 4.3,
//     reviews: 61,
//     hourlyRate: "₹3,500",
//     expertise: ["Property Disputes", "Tenant Rights", "Registration"],
//     availableNow: true
//   },
//   {
//     id: "5",
//     name: "Adv. Meera Kapoor",
//     avatar: "/api/placeholder/150/150",
//     specialization: "Intellectual Property",
//     experience: "10 years",
//     location: "Hyderabad",
//     rating: 4.7,
//     reviews: 84,
//     hourlyRate: "₹6,000",
//     expertise: ["Patents", "Trademarks", "Copyright"],
//     availableNow: false
//   }
// ];

type Lawyer = {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  experience: number | string; // depending on your data (you had "15 years")
  location: string;
  rating: number;
  reviews: number;
  hourlyRate: string;
  expertise: string[];
  availableNow: boolean;
};


const PRACTICE_AREAS = [
  "Family Law",
  "Criminal Law",
  "Corporate Law",
  "Property Law",
  "Intellectual Property",
  "Tax Law",
  "Labour Law",
  "Constitutional Law",
  "Environmental Law",
  "Cyber Law"
];

const LOCATIONS = [
  "Delhi NCR",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Chandigarh",
  "Lucknow"
];

export default function LawyersConnect() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  

  
  const [filters, setFilters] = useState({
    practiceArea: "all",
    location: "all",
    priceRange: [0, 10000],
    availableNow: false,
    experience: "any"
  });

  // Only show theme-dependent content after mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchLawyers = async () => {
      try {
        const res = await fetch("/api/lawyers"); // assumes you created route.ts
        const data = await res.json();
        setLawyers(data);
        setFilteredLawyers(data); // initially unfiltered
      } catch (error) {
        console.error("Failed to fetch lawyers", error);
      }
    };
    fetchLawyers();
  }, []);
  

  useEffect(() => {
    // Apply filters and search
    let results = lawyers;
    
    // Search by name
    if (searchTerm) {
      results = results.filter(lawyer => 
        lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.expertise.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // Apply filters
    if (filters.practiceArea && filters.practiceArea !== "all") {
      results = results.filter(lawyer => lawyer.specialization === filters.practiceArea);
    }
    
    if (filters.location && filters.location !== "all") {
      results = results.filter(lawyer => lawyer.location === filters.location);
    }
    
    if (filters.priceRange) {
      results = results.filter(lawyer => {
        const rate = parseInt(lawyer.hourlyRate.replace(/[^0-9]/g, ''));
        return rate >= filters.priceRange[0] && rate <= filters.priceRange[1];
      });
    }
    
    if (filters.availableNow) {
      results = results.filter(lawyer => lawyer.availableNow);
    }
    
    if (filters.experience && filters.experience !== "any") {
      const years = parseInt(filters.experience);
      results = results.filter(lawyer => {
        const lawyerYears = parseInt(String(lawyer.experience));

        return lawyerYears >= years;
      });
    }
    
    setFilteredLawyers(results);
  }, [searchTerm, filters, lawyers]);

  const isDark = mounted && theme === 'dark';

  const handleChatWithLawyer = (lawyerId:string) => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    router.push(`/lawyer-chat/${lawyerId}`);
  };

  const resetFilters = () => {
    setFilters({
      practiceArea: "all",
      location: "all",
      priceRange: [0, 10000],
      availableNow: false,
      experience: "any"
    });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b px-3 flex justify-center border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between py-4">
          <Link href="/" className="flex items-center gap-2">
            <Scale className="h-6 w-6 text-law-secondary" />
            <span className="text-xl font-bold text-law-primary">JusticeHub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="/#use-cases"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Use Cases
            </Link>
            <Link
              href="/document-analysis"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Document Analysis
            </Link>
            <Link
              href="/connect"
              className="text-sm font-medium text-foreground transition-colors"
            >
              Connect
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {isLoaded && isSignedIn ? (
              <UserButton />
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" className="text-law-primary hover:text-law-primary/90">
                    Sign In
                  </Button>
                </Link>
                <Link href="/sign-up">
                  <Button variant="default" className="bg-law-primary hover:bg-law-primary/90">
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className={`py-8 flex justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="container">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-law-primary">Connect with Legal Professionals</h1>
              <p className="text-muted-foreground mt-2">
                Find and consult with experienced lawyers specializing in various legal fields
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar with filters - for desktop */}
              <div className="hidden md:block w-full md:w-72 flex-shrink-0">
                <div className={`rounded-lg p-6 sticky top-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">Filters</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetFilters}
                    >
                      Reset
                    </Button>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Practice Area</label>
                      <Select 
                        value={filters.practiceArea} 
                        onValueChange={(value) => setFilters({...filters, practiceArea: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select area" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Areas</SelectItem>
                          {PRACTICE_AREAS.map((area) => (
                            <SelectItem key={area} value={area}>{area}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Location</label>
                      <Select 
                        value={filters.location} 
                        onValueChange={(value) => setFilters({...filters, location: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Locations</SelectItem>
                          {LOCATIONS.map((location) => (
                            <SelectItem key={location} value={location}>{location}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Price Range (Hourly)</label>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs">₹{filters.priceRange[0]}</span>
                        <span className="text-xs">₹{filters.priceRange[1]}</span>
                      </div>
                      <Slider
                        defaultValue={[0, 10000]}
                        min={0}
                        max={10000}
                        step={500}
                        value={filters.priceRange}
                        onValueChange={(value) => setFilters({...filters, priceRange: value})}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Minimum Experience</label>
                      <Select 
                        value={filters.experience} 
                        onValueChange={(value) => setFilters({...filters, experience: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="any">Any Experience</SelectItem>
                          <SelectItem value="5">5+ Years</SelectItem>
                          <SelectItem value="10">10+ Years</SelectItem>
                          <SelectItem value="15">15+ Years</SelectItem>
                          <SelectItem value="20">20+ Years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="availableNow" 
                        checked={filters.availableNow}
                        onCheckedChange={(checked) => 
                          setFilters({...filters, availableNow: !!checked})
                        }
                      />
                      <Label htmlFor="availableNow">Available Now</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile filter button */}
              <div className="md:hidden mb-4">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="w-full flex items-center justify-center">
                      <Filter className="mr-2 h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                      <SheetDescription>
                        Narrow down your search for legal professionals
                      </SheetDescription>
                    </SheetHeader>
                    <div className="py-4 space-y-6">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Practice Area</label>
                        <Select 
                          value={filters.practiceArea} 
                          onValueChange={(value) => setFilters({...filters, practiceArea: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select area" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Areas</SelectItem>
                            {PRACTICE_AREAS.map((area) => (
                              <SelectItem key={area} value={area}>{area}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Location</label>
                        <Select 
                          value={filters.location} 
                          onValueChange={(value) => setFilters({...filters, location: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select location" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            {LOCATIONS.map((location) => (
                              <SelectItem key={location} value={location}>{location}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Price Range (Hourly)</label>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs">₹{filters.priceRange[0]}</span>
                          <span className="text-xs">₹{filters.priceRange[1]}</span>
                        </div>
                        <Slider
                          defaultValue={[0, 10000]}
                          min={0}
                          max={10000}
                          step={500}
                          value={filters.priceRange}
                          onValueChange={(value) => setFilters({...filters, priceRange: value})}
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">Minimum Experience</label>
                        <Select 
                          value={filters.experience} 
                          onValueChange={(value) => setFilters({...filters, experience: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Any experience" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Any Experience</SelectItem>
                            <SelectItem value="5">5+ Years</SelectItem>
                            <SelectItem value="10">10+ Years</SelectItem>
                            <SelectItem value="15">15+ Years</SelectItem>
                            <SelectItem value="20">20+ Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="availableNowMobile" 
                          checked={filters.availableNow}
                          onCheckedChange={(checked) => 
                            setFilters({...filters, availableNow: !!checked})
                          }
                        />
                        <Label htmlFor="availableNowMobile">Available Now</Label>
                      </div>
                      
                      <Button 
                        className="w-full mt-4" 
                        onClick={resetFilters}
                      >
                        Reset Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Main content */}
              <div className="w-full space-y-6">
                {/* Search bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, specialization, or expertise..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Results */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {filteredLawyers.length} lawyers found
                    </p>
                    <Select defaultValue="rating">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rating">Highest Rating</SelectItem>
                        <SelectItem value="experience">Most Experienced</SelectItem>
                        <SelectItem value="price-low">Price: Low to High</SelectItem>
                        <SelectItem value="price-high">Price: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {filteredLawyers.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg`}>
                      <p className="text-muted-foreground">No lawyers found matching your criteria.</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => {
                          setSearchTerm("");
                          resetFilters();
                        }}
                      >
                        Clear all filters
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredLawyers.map((lawyer) => (
                        <motion.div
                          key={lawyer.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Card className={`${isDark ? 'border-gray-700 bg-gray-800' : 'bg-white'} overflow-hidden`}>
                            <CardContent className="p-0">
                              <div className="flex flex-col sm:flex-row">
                                <div className="p-6 sm:w-1/4 flex flex-col items-center text-center">
                                  <Avatar className="h-20 w-20 mb-2">
                                    <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                                    <AvatarFallback>{lawyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                  </Avatar>
                                  <h3 className="font-medium text-lg">{lawyer.name}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">{lawyer.specialization}</p>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-yellow-500 mr-1" fill="currentColor" />
                                    <span className="text-sm font-medium">{lawyer.rating}</span>
                                    <span className="text-xs text-muted-foreground ml-1">({lawyer.reviews})</span>
                                  </div>
                                  {lawyer.availableNow && (
                                    <Badge variant="secondary" className="mt-2 bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                      Available Now
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="p-6 sm:w-2/4 border-t sm:border-t-0 sm:border-l sm:border-r">
                                  <div className="space-y-3">
                                    <div className="flex items-start">
                                      <MapPin className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                                      <span>{lawyer.location}</span>
                                    </div>
                                    <div className="flex items-start">
                                      <Clock className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                                      <span>{lawyer.experience} Experience</span>
                                    </div>
                                    <div className="flex items-start">
                                      <DollarSign className="h-4 w-4 text-muted-foreground mr-2 mt-0.5" />
                                      <span>{lawyer.hourlyRate} per hour</span>
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium mb-2">Expertise</p>
                                      <div className="flex flex-wrap gap-2">
                                        {lawyer.expertise.map((item, index) => (
                                          <Badge key={index} variant="outline">
                                            {item}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="p-6 sm:w-1/4 border-t sm:border-t-0 flex flex-col justify-center items-center">
                                  <Button 
                                    className="w-full bg-law-primary hover:bg-law-primary/90"
                                    onClick={() => handleChatWithLawyer(lawyer.id)}
                                  >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Chat Now
                                  </Button>
                                  <Button variant="outline" className="w-full mt-3">
                                    View Profile
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* <footer className={`border-t flex justify-center py-8 ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-gray-50'}`}>
        <div className="text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} JusticeHub. All rights reserved.
          <br />
          Build with <span className="text-law-primary">♥</span> by{' '}
          <a href="https://ayuugoyal.tech" className="text-law-primary hover:underline">Paras Singla</a>
        </div>
      </footer> */}
    </div>
  )
}