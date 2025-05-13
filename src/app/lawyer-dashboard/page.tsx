//app/lawyer-dashboard
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define types for the dashboard
interface LawyerProfile {
  id: number;
  clerkId: string;
  name: string;
  avatar: string;
  specialization: string;
  experience: number;
  location: string;
  rating: number | string;
  hourlyRate: string;
  expertise: string[];
  availableNow: boolean;
  email: string;
  phone?: string;
  bio?: string;
}

interface ClientRequest {
  id: string;
  userId: string;
  clientName: string;
  date: string;
  duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  caseType?: string;
}


interface UpcomingConsultation {
  id: string;
  userId: string;
  clientName: string;
  date: string;
  time: string;
  duration: number;
  status: string;
  notes?: string;
  caseType?: string;
}

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  unreadMessages: number;
}

interface ClientMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

interface Conversation {
  conversationId: string;
  otherParticipantId: string;
  latestMessage: ClientMessage;
  unreadCount: number;
  clientName?: string; // We'll add this from UI side
}

// Define types for API responses
interface AppointmentData {
  id: string;
  userId: string;
  date: string;
  duration: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

interface LawyerDataResponse {
  lawyer: LawyerProfile;
  stats: DashboardStats;
  appointments: {
    pending: AppointmentData[];
    upcoming: AppointmentData[];
  };
  messages?: ClientMessage[];
}


export default function LawyerDashboardPage() {
  const { user, isLoaded: isUserLoaded } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for lawyer data
  const [profile, setProfile] = useState<LawyerProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [clientRequests, setClientRequests] = useState<ClientRequest[]>([]);
  const [upcomingConsultations, setUpcomingConsultations] = useState<UpcomingConsultation[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ClientMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Fetch lawyer data
  useEffect(() => {
    if (!isUserLoaded || !user) return;

    const fetchLawyerData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch lawyer profile and stats
        const response = await fetch('/api/lawyer');
        
        if (!response.ok) {
          throw new Error('Failed to fetch lawyer data');
        }
        
        const data = await response.json() as LawyerDataResponse;
        
        // Transform appointments to match expected format
        const pendingRequests = data.appointments.pending.map((app) => ({
          id: app.id,
          userId: app.userId,
          clientName: app.userId.split('_')[1] || "Client", // Placeholder until we implement client name lookup
          date: new Date(app.date).toLocaleDateString(),
          duration: app.duration,
          status: app.status,
          notes: app.notes,
          caseType: app.notes?.split(' - ')[0] || "Consultation" // Extract case type from notes if available
        }));
        
        const upcoming = data.appointments.upcoming.map((app) => ({
          id: app.id,
          userId: app.userId,
          clientName: app.userId.split('_')[1] || "Client", // Placeholder
          date: new Date(app.date).toLocaleDateString(),
          time: new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          duration: app.duration,
          status: app.status,
          notes: app.notes,
          caseType: app.notes?.split(' - ')[0] || "Consultation"
        }));
        
        // Transform conversations
        const convos = data.messages ? data.messages.reduce((acc: Conversation[], msg: ClientMessage) => {
          // Check if this conversation is already in our accumulator
          const existingConvo = acc.find(c => c.conversationId === msg.conversationId);
          
          if (!existingConvo) {
            // Add new conversation
            acc.push({
              conversationId: msg.conversationId,
              otherParticipantId: msg.senderId === user.id ? msg.receiverId : msg.senderId,
              latestMessage: msg,
              unreadCount: msg.receiverId === user.id && !msg.read ? 1 : 0,
              clientName: msg.senderId.split('_')[1] || "Client" // Placeholder
            });
          } else {
            // Update existing conversation if this message is newer
            if (new Date(msg.createdAt) > new Date(existingConvo.latestMessage.createdAt)) {
              existingConvo.latestMessage = msg;
            }
            // Increment unread count if applicable
            if (msg.receiverId === user.id && !msg.read) {
              existingConvo.unreadCount++;
            }
          }
          
          return acc;
        }, []) : [];
        
        // Set state with fetched data
        setProfile(data.lawyer);
        setStats(data.stats);
        setClientRequests(pendingRequests);
        setUpcomingConsultations(upcoming);
        setConversations(convos);
        
      } catch (err) {
        console.error("Error fetching lawyer data:", err);
        setError("Failed to load your profile data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLawyerData();
  }, [isUserLoaded, user]);

  // Function to fetch messages for a conversation
  const fetchConversationMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/lawyer/messages?conversationId=${conversationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setConversationMessages(data.messages);
      
      // Mark messages as read
      await fetch('/api/lawyer/messages', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ conversationId })
      });
      
      // Update conversation unread count
      setConversations(prev => 
        prev.map(convo => 
          convo.conversationId === conversationId ? 
            { ...convo, unreadCount: 0 } : convo
        )
      );
      
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // Function to send a message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedConversation || !newMessage.trim() || !user) return;
    
    try {
      const conversation = conversations.find(c => c.conversationId === selectedConversation);
      
      if (!conversation) return;
      
      const response = await fetch('/api/lawyer/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: conversation.otherParticipantId,
          content: newMessage,
          conversationId: selectedConversation
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const data = await response.json();
      
      // Add new message to conversation
      setConversationMessages(prev => [data.directMessage, ...prev]);
      setNewMessage("");
      
      // Update conversations list
      setConversations(prev => 
        prev.map(convo => 
          convo.conversationId === selectedConversation ? 
            { ...convo, latestMessage: data.directMessage } : convo
        )
      );
      
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  // Handle request status changes
  const handleRequestAction = async (requestId: string, action: "accept" | "reject" | "complete") => {
    try {
      let newStatus;
      
      if (action === "accept") newStatus = "confirmed";
      else if (action === "reject") newStatus = "cancelled";
      else if (action === "complete") newStatus = "completed";
      else return;
      
      const response = await fetch('/api/lawyer/appointments', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointmentId: requestId,
          status: newStatus
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update appointment');
      }
      
      
      // Update client requests and consultations
      if (action === "accept") {
        setClientRequests(prev => prev.filter(req => req.id !== requestId));
        
        const acceptedRequest = clientRequests.find(req => req.id === requestId);
        if (acceptedRequest) {
          const newConsultation: UpcomingConsultation = {
            ...acceptedRequest,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "confirmed"
          };
          setUpcomingConsultations(prev => [...prev, newConsultation]);
        }
      } else if (action === "reject") {
        setClientRequests(prev => prev.filter(req => req.id !== requestId));
      } else if (action === "complete") {
        setUpcomingConsultations(prev => prev.filter(cons => cons.id !== requestId));
      }
      
      // Update stats
      if (stats) {
        const newStats = { ...stats };
        
        if (action === "accept") {
          newStats.pendingAppointments--;
          newStats.upcomingAppointments++;
        } else if (action === "reject") {
          newStats.pendingAppointments--;
        } else if (action === "complete") {
          newStats.upcomingAppointments--;
          newStats.completedAppointments++;
        }
        
        setStats(newStats);
      }
      
    } catch (err) {
      console.error("Error handling request action:", err);
      setError("Failed to update appointment status. Please try again.");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading your dashboard...</span>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="mb-4">{error}</p>
        <button 
          className="px-4 py-2 bg-primary text-white rounded-md"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className={`${isMenuOpen ? "block" : "hidden"} md:block bg-white w-64 shadow-md md:static fixed inset-y-0 left-0 z-30 overflow-y-auto transition-all`}>
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold">Lawyer Dashboard</h2>
        </div>
        <nav className="p-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`w-full text-left p-3 rounded mb-1 ${activeTab === "overview" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`w-full text-left p-3 rounded mb-1 flex justify-between items-center ${activeTab === "requests" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
          >
            <span>Client Requests</span>
            {clientRequests.length > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {clientRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("consultations")}
            className={`w-full text-left p-3 rounded mb-1 ${activeTab === "consultations" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
          >
            Upcoming Consultations
          </button>
          <button
            onClick={() => setActiveTab("messages")}
            className={`w-full text-left p-3 rounded mb-1 flex justify-between items-center ${activeTab === "messages" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
          >
            <span>Messages</span>
            {stats && stats.unreadMessages > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                {stats.unreadMessages}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`w-full text-left p-3 rounded mb-1 ${activeTab === "profile" ? "bg-primary/10 text-primary font-medium" : "hover:bg-gray-100"}`}
          >
            Profile
          </button>
          <Button 
                                  className="w-full bg-law-primary hover:bg-law-primary/90"
                                  onClick={() => window.location.href = "/videocall"}
>
                                  <MessageSquare className="mr-2 h-4 w-4" />
                                  Request a video call
                                 </Button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        {/* Top nav */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <button 
            className="md:hidden block"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-4">
            {profile && (
              <>
                <span className="font-medium hidden md:block">Welcome, {profile.name}</span>
                  <Image
                    src={profile.avatar || "/api/placeholder/32/32"}
                    alt="Avatar"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
              </>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Overview */}
          {activeTab === "overview" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
              
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm text-gray-500">Total Appointments</h3>
                  <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm text-gray-500">Pending Requests</h3>
                  <p className="text-2xl font-bold">{stats?.pendingAppointments || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm text-gray-500">Upcoming</h3>
                  <p className="text-2xl font-bold">{stats?.upcomingAppointments || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h3 className="text-sm text-gray-500">Completed</h3>
                  <p className="text-2xl font-bold">{stats?.completedAppointments || 0}</p>
                </div>
              </div>
              
              {/* Recent activity */}
              <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">Recent Client Requests</h2>
                {clientRequests.length > 0 ? (
                  <div className="space-y-4">
                    {clientRequests.slice(0, 3).map(request => (
                      <div key={request.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{request.clientName}</h3>
                            <p className="text-sm text-gray-500">{request.caseType} - {request.date}</p>
                          </div>
                          <div className="space-x-2">
                            <button 
                              onClick={() => handleRequestAction(request.id, "accept")}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded-md"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRequestAction(request.id, "reject")}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-md"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                        {request.notes && (
                          <p className="text-sm mt-2 text-gray-600">{request.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No pending client requests.</p>
                )}
                
                {clientRequests.length > 3 && (
                  <button 
                    onClick={() => setActiveTab("requests")}
                    className="mt-4 text-primary text-sm font-medium"
                  >
                    View all requests
                  </button>
                )}
              </div>
              
              {/* Upcoming consultations */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4">Upcoming Consultations</h2>
                {upcomingConsultations.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingConsultations.slice(0, 3).map(consultation => (
                      <div key={consultation.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{consultation.clientName}</h3>
                            <p className="text-sm text-gray-500">
                              {consultation.caseType} - {consultation.date} at {consultation.time}
                            </p>
                          </div>
                          <button 
                            onClick={() => handleRequestAction(consultation.id, "complete")}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
                          >
                            Mark Complete
                          </button>
                        </div>
                        {consultation.notes && (
                          <p className="text-sm mt-2 text-gray-600">{consultation.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No upcoming consultations.</p>
                )}
                
                {upcomingConsultations.length > 3 && (
                  <button 
                    onClick={() => setActiveTab("consultations")}
                    className="mt-4 text-primary text-sm font-medium"
                  >
                    View all consultations
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Client Requests */}
          {activeTab === "requests" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Client Requests</h1>
              
              {clientRequests.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="space-y-4">
                    {clientRequests.map(request => (
                      <div key={request.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{request.clientName}</h3>
                            <p className="text-sm text-gray-500">{request.caseType} - {request.date}</p>
                            <p className="text-sm text-gray-500">Duration: {request.duration} minutes</p>
                          </div>
                          <div className="space-x-2">
                            <button 
                              onClick={() => handleRequestAction(request.id, "accept")}
                              className="px-3 py-1 bg-green-500 text-white text-sm rounded-md"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={() => handleRequestAction(request.id, "reject")}
                              className="px-3 py-1 bg-red-500 text-white text-sm rounded-md"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                        {request.notes && (
                          <p className="text-sm mt-2 text-gray-600">{request.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500">No pending client requests.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Upcoming Consultations */}
          {activeTab === "consultations" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Upcoming Consultations</h1>
              
              {upcomingConsultations.length > 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="space-y-4">
                    {upcomingConsultations.map(consultation => (
                      <div key={consultation.id} className="border-b pb-4 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{consultation.clientName}</h3>
                            <p className="text-sm text-gray-500">
                              {consultation.caseType} - {consultation.date} at {consultation.time}
                            </p>
                            <p className="text-sm text-gray-500">Duration: {consultation.duration} minutes</p>
                          </div>
                          <button 
                            onClick={() => handleRequestAction(consultation.id, "complete")}
                            className="px-3 py-1 bg-blue-500 text-white text-sm rounded-md"
                          >
                            Mark Complete
                          </button>
                        </div>
                        {consultation.notes && (
                          <p className="text-sm mt-2 text-gray-600">{consultation.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                  <p className="text-gray-500">No upcoming consultations.</p>
                </div>
              )}
            </div>
          )}
          
          {/* Messages */}
          {activeTab === "messages" && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Messages</h1>
              
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3">
                  {/* Conversations sidebar */}
                  <div className="border-r">
                    <div className="p-4 border-b">
                      <h2 className="font-medium">Conversations</h2>
                    </div>
                    <div className="overflow-y-auto" style={{ maxHeight: "600px" }}>
                      {conversations.length > 0 ? (
                        conversations.map(convo => (
                          <button
                            key={convo.conversationId}
                            onClick={() => {
                              setSelectedConversation(convo.conversationId);
                              fetchConversationMessages(convo.conversationId);
                            }}
                            className={`w-full text-left p-4 border-b hover:bg-gray-50 relative ${selectedConversation === convo.conversationId ? "bg-primary/5" : ""}`}
                          >
                            <h3 className="font-medium">{convo.clientName}</h3>
                            <p className="text-sm text-gray-500 truncate">
                              {convo.latestMessage.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(convo.latestMessage.createdAt).toLocaleString()}
                            </p>
                            
                            {convo.unreadCount > 0 && (
                              <span className="absolute top-4 right-4 bg-primary text-white text-xs px-2 py-1 rounded-full">
                                {convo.unreadCount}
                              </span>
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No conversations yet.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Messages area */}
                  <div className="md:col-span-2 flex flex-col">
                    {selectedConversation ? (
                      <>
                        <div className="p-4 border-b">
                          <h2 className="font-medium">
                            {conversations.find(c => c.conversationId === selectedConversation)?.clientName}
                          </h2>
                        </div>
                        
                        {/* Messages list */}
                        <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "500px" }}>
                          {conversationMessages.length > 0 ? (
                            <div className="space-y-4">
                              {conversationMessages.map(msg => (
                                <div 
                                  key={msg.id}
                                  className={`flex ${msg.senderId === user?.id ? "justify-end" : "justify-start"}`}
                                >
                                  <div 
                                    className={`max-w-xs md:max-w-md rounded-lg p-3 ${
                                      msg.senderId === user?.id 
                                        ? "bg-primary text-white" 
                                        : "bg-gray-100"
                                    }`}
                                  >
                                    <p>{msg.content}</p>
                                    <p className={`text-xs mt-1 ${msg.senderId === user?.id ? "text-primary-100" : "text-gray-500"}`}>
                                      {new Date(msg.createdAt).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <p className="text-gray-500">No messages yet.</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Message input */}
                        <form onSubmit={sendMessage} className="p-4 border-t">
                          <div className="flex">
                            <input
                              type="text"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="Type your message..."
                              className="flex-1 px-4 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-primary text-white rounded-r-md"
                              disabled={!newMessage.trim()}
                            >
                              Send
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-500">Select a conversation to view messages.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Profile */}
          {activeTab === "profile" && profile && (
            <div>
              <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-col md:flex-row items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <Image
                      src={profile.avatar || "/api/placeholder/128/128"} 
                      alt={profile.name}
                          width={32}
                           height={32}

                      className="rounded-full object-cover"
                    />
                  </div>
                  
                  {/* Profile info */}
                  <div className="flex-grow">
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <p className="text-gray-600 mb-4">{profile.specialization}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-2">Contact Information</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Email:</span> {profile.email}
                        </p>
                        {profile.phone && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Phone:</span> {profile.phone}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Location:</span> {profile.location}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">Professional Information</h3>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Years of Experience:</span> {profile.experience}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Rating:</span> {profile.rating}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Hourly Rate:</span> {profile.hourlyRate}
                        </p>
                      </div>
                    </div>
                    
                    {/* Expertise */}
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Areas of Expertise</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.expertise.map((item, index) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {/* Bio */}
                    {profile.bio && (
                      <div className="mt-6">
                        <h3 className="font-medium mb-2">About</h3>
                        <p className="text-gray-600">{profile.bio}</p>
                      </div>
                    )}
                    
                    {/* Edit profile button */}
                    <div className="mt-6">
                      <Link href="/lawyer/profile/edit">
                        <button className="px-4 py-2 bg-primary text-white rounded-md">
                          Edit Profile
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}