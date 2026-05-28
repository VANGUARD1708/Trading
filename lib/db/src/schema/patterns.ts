import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const patternsTable = pgTable("patterns", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id").notNull(),
  symbol: text("symbol").notNull(),
  patternType: text("pattern_type").notNull(),
  direction: text("direction").notNull(),
  confidence: real("confidence").notNull(),
  timeframe: text("timeframe").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  description: text("description").notNull(),
  priceLevel: real("price_level").notNull(),
  status: text("status").notNull().default("forming"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPatternSchema = createInsertSchema(patternsTable).omit({ id: true, createdAt: true });
export type InsertPattern = z.infer<typeof insertPatternSchema>;
export type Pattern = typeof patternsTable.$inferSelect;
