import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const forecastsTable = pgTable("forecasts", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id").notNull(),
  symbol: text("symbol").notNull(),
  timeframe: text("timeframe").notNull(),
  currentPrice: real("current_price").notNull(),
  bullishTarget: real("bullish_target").notNull(),
  bearishTarget: real("bearish_target").notNull(),
  baseTarget: real("base_target").notNull(),
  bullishProbability: real("bullish_probability").notNull(),
  bearishProbability: real("bearish_probability").notNull(),
  neutralProbability: real("neutral_probability").notNull(),
  confidence: real("confidence").notNull(),
  horizon: text("horizon").notNull(),
  keyDrivers: text("key_drivers").notNull().default("[]"),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const insertForecastSchema = createInsertSchema(forecastsTable).omit({ id: true, generatedAt: true });
export type InsertForecast = z.infer<typeof insertForecastSchema>;
export type Forecast = typeof forecastsTable.$inferSelect;
