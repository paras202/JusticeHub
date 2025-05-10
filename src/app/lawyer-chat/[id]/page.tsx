//app/lawyer-chat/[id]/page.tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Scale, Send, Calendar, ArrowLeft, PaperclipIcon, MoreVertical, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useUser } from "@clerk/nextjs"
import { useTheme } from "next-themes"
import { Lawyer, Message } from "@/types/lawyer"

export default function LawyerChatPage() {
  const router = useRouter();
  const params = useParams();
  const lawyerId = params.id as string;
  const { user } = useUser();
  const { theme } = useTheme();
  const [lawyer, setLawyer] = useState<Lawyer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Represents the shape of a message as returned by the API (timestamp still a string)
type RawMessage = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
};


  useEffect(() => {
    const fetchLawyerProfile = async () => {
      if (!lawyerId) return;
      
      setIsLoading(true);
      try {
        console.log("Fetching lawyer with ID:", lawyerId);
        const res = await fetch(`/api/lawyers/${lawyerId}`);
        
        if (!res.ok) {
          console.error("Error response:", await res.text());
          throw new Error("Failed to fetch lawyer");
        }
        
        const data = await res.json();
        console.log("Lawyer data received:", data);
        setLawyer(data);
      } catch (error) {
        console.error("Error fetching lawyer profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (lawyerId) {
      fetchLawyerProfile();
    }
  }, [lawyerId]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        if (!user?.id || !lawyerId) return;
        
        // Fetch messages from API
        const res = await fetch(`/api/messages?lawyerId=${lawyerId}&userId=${user.id}`);
        if (res.ok) {
          const data = (await res.json()) as RawMessage[];
          // Transform date strings back to Date objects
          const processedMessages: Message[] = data.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(processedMessages);
        } else {
          console.error("Failed to fetch messages:", await res.text());
          // Initialize with a welcome message on error
          const welcomeMessage: Message = {
            id: "1",
            senderId: "lawyer",
            receiverId: user.id,
            content: "Hello! I'm your legal assistant. How can I help you with your legal matter today?",
            timestamp: new Date(),
            isRead: true
          };
          
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error("Failed to fetch messages", error);
        // Initialize with welcome message on error
        const welcomeMessage: Message = {
          id: "1",
          senderId: "lawyer",
          receiverId: user?.id || "",
          content: "Hello! I'm your legal assistant. How can I help you with your legal matter today?",
          timestamp: new Date(),
          isRead: true
        };
        
        setMessages([welcomeMessage]);
      }
    };

    if (user?.id && lawyerId) {
      fetchMessages();
    }
  }, [user?.id, lawyerId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      setIsTyping(true);
      
      // Make a request to your backend API that calls Gemini AI
      const response = await fetch('/api/ai-lawyer-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lawyerId,
          message: userMessage,
          chatHistory: messages.map(msg => ({
            role: msg.senderId === "lawyer" ? "assistant" : "user",
            content: msg.content
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error getting AI response:', error);
      return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.";
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.id) return;
    
    setIsSending(true);
    
    try {
      // Add user message to the chat
      const userMsg: Message = {
        id: Date.now().toString(),
        senderId: user.id,
        receiverId: "lawyer",
        content: newMessage,
        timestamp: new Date(),
        isRead: false
      };
      
      setMessages(prev => [...prev, userMsg]);
      setNewMessage("");
      
      // Get AI response
      const aiResponse = await getAIResponse(newMessage);
      
      const lawyerMsg: Message = {
        id: (Date.now() + 1).toString(),
        senderId: "lawyer",
        receiverId: user.id,
        content: aiResponse,
        timestamp: new Date(),
        isRead: true
      };
      
      setMessages(prev => [...prev, lawyerMsg]);
      
    } catch (error) {
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleScheduleConsultation = () => {
    router.push(`/schedule-consultation/${lawyerId}`);
  };

  const formatMessageTime = (date: Date): string => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (today.toDateString() === messageDate.toDateString()) {
      // Today, show time only
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Not today, show date and time
      return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' at ' + 
             messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const isDark = theme === 'dark';

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-primary"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-law-primary mb-4"></div>
        <p className="text-muted-foreground">Loading lawyer profile...</p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Scale className="h-12 w-12 text-law-secondary mb-4" />
        <h1 className="text-2xl font-bold mb-2">Lawyer Not Found</h1>
        <p className="text-muted-foreground mb-6">The lawyer you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        <Link href="/lawyer-connect">
          <Button>Back to Lawyers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Chat header */}
      <header className={`sticky top-0 z-10 border-b ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <Link href="/lawyer-connect" className="mr-1">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            
            <Avatar className="h-10 w-10">
              <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
              <AvatarFallback>{lawyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-medium">{lawyer.name}</h1>
                {lawyer.availableNow && (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                    Online
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{lawyer.specialization}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleScheduleConsultation}>
                    <Calendar className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Schedule Consultation</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/lawyer/${lawyerId}`)}>
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem>Clear Chat</DropdownMenuItem>
                <DropdownMenuItem>Report Issue</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Chat messages */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="container max-w-4xl mx-auto">
          <div className="space-y-6 py-4">
            {/* Chat start information */}
            <div className="flex flex-col items-center justify-center text-center py-6">
              <Avatar className="h-16 w-16 mb-4">
                <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                <AvatarFallback>{lawyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-bold">{lawyer.name}</h2>
              <p className="text-muted-foreground mb-2">{lawyer.specialization} • {lawyer.experience} Experience</p>
              <div className="flex gap-3 mt-2">
                <Button variant="outline" size="sm" onClick={handleScheduleConsultation}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Schedule Consultation
                </Button>
              </div>
            </div>

            <Separator className="my-4" />
            
            {/* Messages */}
            {messages.map((message) => {
              const isUserMessage = message.senderId === user?.id;
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="flex gap-2 max-w-[80%]">
                    {!isUserMessage && (
                      <Avatar className="h-8 w-8 mt-1">
                        <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                        <AvatarFallback>{lawyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className="flex flex-col">
                      <div
                        className={`rounded-lg p-3 ${
                          isUserMessage 
                            ? 'bg-law-primary text-white' 
                            : isDark 
                              ? 'bg-gray-800 border border-gray-700' 
                              : 'bg-gray-100'
                        }`}
                      >
                        {message.content}
                      </div>
                      
                      <span className="text-xs text-muted-foreground mt-1 px-1">
                        {formatMessageTime(message.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex gap-2 max-w-[80%]">
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={lawyer.avatar} alt={lawyer.name} />
                    <AvatarFallback>{lawyer.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                    <div
                      className={`rounded-lg p-3 ${
                        isDark 
                          ? 'bg-gray-800 border border-gray-700' 
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-75"></div>
                        <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse delay-150"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Chat input */}
      <footer className={`sticky bottom-0 border-t p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
        <div className="container max-w-4xl mx-auto">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Button type="button" variant="ghost" size="icon">
              <PaperclipIcon className="h-5 w-5" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
              disabled={isSending || isTyping}
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={!newMessage.trim() || isSending || isTyping}
              className="bg-law-primary hover:bg-law-primary/90"
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
          <div className="text-xs text-center text-muted-foreground mt-2">
            <Clock className="inline-block h-3 w-3 mr-1" />
            AI-powered legal assistant - Instant responses
          </div>
        </div>
      </footer>
    </div>
  );
}