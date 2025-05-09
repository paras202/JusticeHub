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

