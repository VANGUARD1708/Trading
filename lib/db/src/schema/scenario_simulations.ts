import { pgTable, serial, text, integer, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scenarioSimulationsTable = pgTable("scenario_simulations", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  scenarioType: text("scenario_type").notNull(),
  customPrompt: text("custom_prompt").notNull().default(""),
  timeframe: text("timeframe").notNull(),
  numPaths: integer("num_paths").notNull().default(20),
  horizonCandles: integer("horizon_candles").notNull().default(50),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scenarioPathsTable = pgTable("scenario_paths", {
  id: serial("id").primaryKey(),
  simulationId: integer("simulation_id").notNull(),
  pathIndex: integer("path_index").notNull(),
  label: text("label").notNull(),
  probability: real("probability").notNull(),
  prices: text("prices").notNull().default("[]"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertScenarioSimulationSchema = createInsertSchema(scenarioSimulationsTable).omit({ id: true, createdAt: true });
export type InsertScenarioSimulation = z.infer<typeof insertScenarioSimulationSchema>;
export type ScenarioSimulation = typeof scenarioSimulationsTable.$inferSelect;

export const insertScenarioPathSchema = createInsertSchema(scenarioPathsTable).omit({ id: true, createdAt: true });
export type InsertScenarioPath = z.infer<typeof insertScenarioPathSchema>;
export type ScenarioPath = typeof scenarioPathsTable.$inferSelect;
