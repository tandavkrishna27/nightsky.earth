import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// News Article types (from Spaceflight News API)
export const newsAuthorSchema = z.object({
  name: z.string(),
  socials: z.string().nullable(),
});

export const newsArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  url: z.string(),
  image_url: z.string(),
  news_site: z.string(),
  summary: z.string(),
  published_at: z.string(),
  updated_at: z.string(),
  featured: z.boolean(),
  authors: z.array(newsAuthorSchema).optional(),
  launches: z.array(z.any()).optional(),
  events: z.array(z.any()).optional(),
});

export const paginatedNewsResponseSchema = z.object({
  count: z.number(),
  next: z.string().nullable(),
  previous: z.string().nullable(),
  results: z.array(newsArticleSchema),
});

export type NewsAuthor = z.infer<typeof newsAuthorSchema>;
export type NewsArticle = z.infer<typeof newsArticleSchema>;
export type PaginatedNewsResponse = z.infer<typeof paginatedNewsResponseSchema>;
