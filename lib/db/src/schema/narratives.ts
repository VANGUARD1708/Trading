import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const narrativesTable = pgTable("narratives", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id").notNull(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  headline: text("headline").notNull(),
  summary: text("summary").notNull(),
  bullishCase: text("bullish_case").notNull(),
  bearishCase: text("bearish_case").notNull(),
  keyLevels: text("key_levels").notNull().default("[]"),
  sentiment: text("sentiment").notNull(),
  riskFactors: text("risk_factors").notNull().default("[]"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertNarrativeSchema = createInsertSchema(narrativesTable).omit({ id: true, generatedAt: true });
export type InsertNarrative = z.infer<typeof insertNarrativeSchema>;
export type Narrative = typeof narrativesTable.$inferSelect;
