// app/types/lawyer.ts
export interface Lawyer {
  id: string | number;
  name: string;
  avatar: string;
  specialization: string;
  experience: string | number;
  location: string;
  availableNow: boolean;
  rating?: string | number;
  reviews?: number;
  hourlyRate?: string;
  expertise?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

export interface ChatMessage {
  role: string;
  content: string;
}