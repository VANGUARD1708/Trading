import { Router } from "express";
import { db } from "@workspace/db";
import {
  instrumentsTable,
  patternsTable,
  tradeSetupsTable,
  activityEventsTable,
} from "@workspace/db";
import { eq, desc, gte } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  const instruments = await db.select().from(instrumentsTable);

  const bullishCount = instruments.filter(i =>
    i.marketSentiment === "bullish" || i.marketSentiment === "strongly_bullish"
  ).length;
  const bearishCount = instruments.filter(i =>
    i.marketSentiment === "bearish" || i.marketSentiment === "strongly_bearish"
  ).length;
  const neutralCount = instruments.filter(i => i.marketSentiment === "neutral").length;

  const activeSetups = await db.select().from(tradeSetupsTable).where(eq(tradeSetupsTable.status, "active"));

  const highConfPatterns = await db.select().from(patternsTable).where(
    eq(patternsTable.status, "confirmed")
  );

  const topMover = instruments.length > 0
    ? instruments.reduce((max, i) =>
        Math.abs(i.priceChangePct24h) > Math.abs(max.priceChangePct24h) ? i : max
      , instruments[0])
    : null;

  const avgConf = activeSetups.length > 0
    ? activeSetups.reduce((sum, s) => sum + s.confidence, 0) / activeSetups.length
    : 0;

  res.json({
    totalInstruments: instruments.length,
    bullishCount,
    bearishCount,
    neutralCount,
    activeSetupsCount: activeSetups.length,
    highConfidencePatterns: highConfPatterns.length,
    topMover: topMover?.symbol ?? "N/A",
    topMoverPct: topMover?.priceChangePct24h ?? 0,
    avgConfidence: avgConf,
    lastUpdated: new Date().toISOString(),
  });
});

router.get("/dashboard/activity", async (_req, res) => {
  const events = await db.select()
    .from(activityEventsTable)
    .orderBy(desc(activityEventsTable.timestamp))
    .limit(20);

  res.json(events.map(e => ({
    ...e,
    timestamp: e.timestamp.toISOString(),
  })));
});

router.get("/dashboard/top-setups", async (_req, res) => {
  const setups = await db.select()
    .from(tradeSetupsTable)
    .where(eq(tradeSetupsTable.status, "active"))
    .orderBy(desc(tradeSetupsTable.confidence))
    .limit(5);

  res.json(setups.map(s => ({
    ...s,
    takeProfits: JSON.parse(s.takeProfits as string),
    createdAt: s.createdAt.toISOString(),
  })));
});

export default router;
