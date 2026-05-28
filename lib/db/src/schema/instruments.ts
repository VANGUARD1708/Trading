import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const instrumentsTable = pgTable("instruments", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  currentPrice: real("current_price").notNull().default(0),
  priceChange24h: real("price_change_24h").notNull().default(0),
  priceChangePct24h: real("price_change_pct_24h").notNull().default(0),
  volume24h: real("volume_24h").notNull().default(0),
  marketSentiment: text("market_sentiment").notNull().default("neutral"),
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

export const insertInstrumentSchema = createInsertSchema(instrumentsTable).omit({ id: true, addedAt: true });
export type InsertInstrument = z.infer<typeof insertInstrumentSchema>;
export type Instrument = typeof instrumentsTable.$inferSelect;
