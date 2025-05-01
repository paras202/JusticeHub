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
