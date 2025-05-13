import { pgTable, uuid, text, timestamp, varchar, serial, boolean, integer, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const chats = pgTable("chats", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 256 }).notNull(),
  title: text("title").default("New Chat"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  chatId: uuid("chat_id")
    .references(() => chats.id)
    .notNull(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatRelations = relations(chats, ({ many }) => ({
  messages: many(messages),
}));

export const messageRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id],
  }),
}));


export const lawyers = pgTable("lawyers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  avatar: text("avatar").default("/api/placeholder/150/150"),
  specialization: text("specialization").notNull(),
  experience: integer("experience").notNull(),
  location: text("location").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
  reviews: integer("reviews").notNull(),
  hourlyRate: text("hourly_rate").notNull(), // or use numeric if needed
  expertise: text("expertise").array().notNull(),
  availableNow: boolean("available_now").notNull()
});

// Updated schema to use Clerk authentication
export const lawyersre = pgTable("lawyersre", {
  id: serial("id").primaryKey(),
  // Link to Clerk authentication
  clerkId: varchar("clerk_id", { length: 256 }).notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar").default("/api/placeholder/150/150"),
  specialization: text("specialization").notNull(),
  experience: integer("experience").notNull(),
  location: text("location").notNull(),
  rating: numeric("rating", { precision: 2, scale: 1 }).notNull(),
  hourlyRate: text("hourly_rate").notNull(),
  expertise: text("expertise").array().notNull(),
  availableNow: boolean("available_now").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  bio: text("bio"),
  // Removed password field since authentication is handled by Clerk
});

// You could add additional tables for education history, reviews, etc.
export const lawyerEducation = pgTable("lawyer_education", {
  id: serial("id").primaryKey(),
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersre.id),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  year: text("year").notNull()
});

export const lawyerBio = pgTable("lawyer_bio", {
  lawyerId: integer("lawyer_id").primaryKey().references(() => lawyersre.id),
  bio: text("bio").notNull()
});

export const lawyermessage = pgTable("lawyermessage", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  attachments: text("attachments").array()
});

// Consultations table for scheduling
export const consultations = pgTable("consultations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  lawyerId: integer("lawyer_id").notNull(),
  scheduledAt: timestamp("scheduled_at").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull(), // "pending", "confirmed", "completed", "cancelled"
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Direct Messages table
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationId: text("conversation_id").notNull(), // Used to group messages in a conversation
  senderId: text("sender_id").notNull(), // Clerk user ID of sender
  receiverId: text("receiver_id").notNull(), // Clerk user ID of recipient
  content: text("content").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  lawyerId: integer("lawyer_id").notNull().references(() => lawyersre.id),
  userId: text("user_id").notNull(), // Clerk user ID
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status").notNull().default("pending"), // pending, confirmed, completed, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});