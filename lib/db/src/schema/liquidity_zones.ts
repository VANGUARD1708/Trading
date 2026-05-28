import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const liquidityZonesTable = pgTable("liquidity_zones", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id").notNull(),
  symbol: text("symbol").notNull(),
  zoneType: text("zone_type").notNull(),
  priceLevel: real("price_level").notNull(),
  priceRangeHigh: real("price_range_high").notNull(),
  priceRangeLow: real("price_range_low").notNull(),
  strength: text("strength").notNull(),
  timeframe: text("timeframe").notNull(),
  description: text("description").notNull(),
  testedCount: integer("tested_count").notNull().default(0),
  lastTested: timestamp("last_tested"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertLiquidityZoneSchema = createInsertSchema(liquidityZonesTable).omit({ id: true, createdAt: true });
export type InsertLiquidityZone = z.infer<typeof insertLiquidityZoneSchema>;
export type LiquidityZone = typeof liquidityZonesTable.$inferSelect;
