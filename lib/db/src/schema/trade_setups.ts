import { pgTable, serial, text, real, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tradeSetupsTable = pgTable("trade_setups", {
  id: serial("id").primaryKey(),
  instrumentId: integer("instrument_id").notNull(),
  symbol: text("symbol").notNull(),
  direction: text("direction").notNull(),
  setupType: text("setup_type").notNull(),
  entryPrice: real("entry_price").notNull(),
  stopLoss: real("stop_loss").notNull(),
  takeProfits: text("take_profits").notNull().default("[]"),
  riskReward: real("risk_reward").notNull(),
  confidence: real("confidence").notNull(),
  timeframe: text("timeframe").notNull(),
  rationale: text("rationale").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTradeSetupSchema = createInsertSchema(tradeSetupsTable).omit({ id: true, createdAt: true });
export type InsertTradeSetup = z.infer<typeof insertTradeSetupSchema>;
export type TradeSetup = typeof tradeSetupsTable.$inferSelect;
