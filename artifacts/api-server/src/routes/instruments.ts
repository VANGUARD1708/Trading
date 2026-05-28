import { Router } from "express";
import { db } from "@workspace/db";
import {
  instrumentsTable,
  patternsTable,
  liquidityZonesTable,
  forecastsTable,
  narrativesTable,
  tradeSetupsTable,
  activityEventsTable,
} from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  AddInstrumentBody,
  GetInstrumentParams,
  GetCandlesParams,
  GetPatternsParams,
  GetLiquidityZonesParams,
  GetForecastParams,
  GetNarrativeParams,
  GenerateNarrativeParams,
  GenerateNarrativeBody,
  GetTradeSetupsParams,
  RunAnalysisParams,
  RunAnalysisBody,
} from "@workspace/api-zod";

const router = Router();

function generateCandles(symbol: string, timeframe: string, count = 100) {
  const basePrice = symbol.includes("BTC")
    ? 67000
    : symbol.includes("ETH")
    ? 3500
    : symbol.includes("EUR")
    ? 1.08
    : symbol.includes("GOLD")
    ? 2340
    : symbol.includes("SPX")
    ? 5200
    : 100;

  const candles = [];
  let price = basePrice;
  const now = Date.now();
  const tfMs: Record<string, number> = {
    "1m": 60000,
    "5m": 300000,
    "15m": 900000,
    "1h": 3600000,
    "4h": 14400000,
    "1d": 86400000,
  };
  const intervalMs = tfMs[timeframe] ?? 3600000;

  for (let i = count; i >= 0; i--) {
    const ts = new Date(now - i * intervalMs).toISOString();
    const volatility = basePrice * 0.008;
    const open = price;
    const change = (Math.random() - 0.48) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    const volume = Math.random() * 1000000 + 500000;
    candles.push({ timestamp: ts, open, high, low, close, volume });
    price = close;
  }
  return candles;
}

function generateForecastData(instrument: typeof instrumentsTable.$inferSelect, timeframe: string) {
  const p = instrument.currentPrice;
  const bullMult = 1 + (Math.random() * 0.06 + 0.02);
  const bearMult = 1 - (Math.random() * 0.06 + 0.02);
  const baseMult = 1 + (Math.random() * 0.02 - 0.01);
  return {
    currentPrice: p,
    bullishTarget: p * bullMult,
    bearishTarget: p * bearMult,
    baseTarget: p * baseMult,
    bullishProbability: 0.45 + Math.random() * 0.15,
    bearishProbability: 0.2 + Math.random() * 0.15,
    neutralProbability: 0.15 + Math.random() * 0.1,
    confidence: 0.65 + Math.random() * 0.2,
    horizon: timeframe === "1d" ? "5-7 days" : timeframe === "4h" ? "2-3 days" : "12-24 hours",
    keyDrivers: [
      "Breakout above key resistance confluence",
      "Volume profile showing accumulation",
      "RSI divergence forming on higher timeframe",
      "Institutional order flow detected at current level",
    ],
  };
}

function generateNarrativeData(instrument: typeof instrumentsTable.$inferSelect, timeframe: string) {
  const sentiment = instrument.marketSentiment;
  return {
    headline: `${instrument.symbol} Approaches Critical Decision Point — Bulls and Bears Converge`,
    summary: `${instrument.name} is trading at a significant inflection zone where multiple technical factors collide. The ${timeframe} timeframe reveals a complex interplay between institutional accumulation signals and retail-driven volatility. Price action suggests a resolution is imminent as compression tightens near a major liquidity cluster.`,
    bullishCase: `A decisive close above the current resistance cluster would activate the bullish scenario. Institutional order flow analysis points to significant buy-side pressure building below current price. If momentum shifts decisively upward, the measured move projects a ${(Math.random() * 5 + 3).toFixed(1)}% extension toward the next major liquidity pool.`,
    bearishCase: `Failure to reclaim the key pivot level opens the door to a deeper retracement. The bearish scenario gains credibility if volume deteriorates on any attempted bounce. A break below the structural support would expose the market to the next demand zone, representing a potential ${(Math.random() * 4 + 2).toFixed(1)}% drawdown.`,
    sentiment,
    keyLevels: [
      instrument.currentPrice * 1.035,
      instrument.currentPrice * 1.018,
      instrument.currentPrice,
      instrument.currentPrice * 0.985,
      instrument.currentPrice * 0.962,
    ],
    riskFactors: [
      "Macro uncertainty could override technical signals",
      "Low liquidity windows may amplify moves",
      "Correlated asset divergence creating mixed signals",
    ],
  };
}

router.get("/instruments", async (_req, res) => {
  const instruments = await db.select().from(instrumentsTable).orderBy(desc(instrumentsTable.addedAt));
  res.json(instruments);
});

router.post("/instruments", async (req, res) => {
  const body = AddInstrumentBody.parse(req.body);

  const priceMap: Record<string, number> = {
    "BTC/USD": 67420, "ETH/USD": 3512, "SOL/USD": 165, "EUR/USD": 1.0845,
    "GBP/USD": 1.2710, "XAU/USD": 2342, "SPX500": 5210, "NAS100": 18420,
  };

  const sentiments = ["strongly_bullish", "bullish", "neutral", "bearish", "strongly_bearish"] as const;
  const basePrice = priceMap[body.symbol] ?? 100 + Math.random() * 900;
  const change = (Math.random() - 0.48) * basePrice * 0.02;

  const [instrument] = await db.insert(instrumentsTable).values({
    symbol: body.symbol,
    name: body.name,
    category: body.category,
    currentPrice: basePrice,
    priceChange24h: change,
    priceChangePct24h: (change / basePrice) * 100,
    volume24h: Math.random() * 5000000000 + 500000000,
    marketSentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
  }).returning();

  res.status(201).json(instrument);
});

router.get("/instruments/:symbol", async (req, res) => {
  const { symbol } = GetInstrumentParams.parse(req.params);
  const [instrument] = await db.select().from(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  if (!instrument) return res.status(404).json({ error: "Instrument not found" });
  res.json(instrument);
});

router.delete("/instruments/:symbol", async (req, res) => {
  const { symbol } = GetInstrumentParams.parse(req.params);
  await db.delete(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  res.status(204).end();
});

router.get("/instruments/:symbol/candles/:timeframe", async (req, res) => {
  const { symbol } = GetCandlesParams.parse(req.params);
  const { timeframe } = GetCandlesParams.parse(req.params);
  const candles = generateCandles(symbol, timeframe);
  res.json(candles);
});

router.get("/instruments/:symbol/patterns/:timeframe", async (req, res) => {
  const { symbol } = GetPatternsParams.parse(req.params);
  const { timeframe } = GetPatternsParams.parse(req.params);
  const [instrument] = await db.select().from(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  if (!instrument) return res.status(404).json({ error: "Instrument not found" });

  const patterns = await db.select().from(patternsTable).where(
    and(eq(patternsTable.symbol, symbol), eq(patternsTable.timeframe, timeframe))
  ).orderBy(desc(patternsTable.createdAt));

  res.json(patterns.map(p => ({
    ...p,
    startTime: p.startTime.toISOString(),
    endTime: p.endTime.toISOString(),
  })));
});

router.get("/instruments/:symbol/liquidity-zones/:timeframe", async (req, res) => {
  const { symbol } = GetLiquidityZonesParams.parse(req.params);
  const { timeframe } = GetLiquidityZonesParams.parse(req.params);
  const zones = await db.select().from(liquidityZonesTable).where(
    and(eq(liquidityZonesTable.symbol, symbol), eq(liquidityZonesTable.timeframe, timeframe))
  );

  res.json(zones.map(z => ({
    ...z,
    lastTested: z.lastTested ? z.lastTested.toISOString() : null,
  })));
});

router.get("/instruments/:symbol/forecast/:timeframe", async (req, res) => {
  const { symbol } = GetForecastParams.parse(req.params);
  const { timeframe } = GetForecastParams.parse(req.params);

  const [instrument] = await db.select().from(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  if (!instrument) return res.status(404).json({ error: "Instrument not found" });

  let [forecast] = await db.select().from(forecastsTable).where(
    and(eq(forecastsTable.symbol, symbol), eq(forecastsTable.timeframe, timeframe))
  ).orderBy(desc(forecastsTable.generatedAt)).limit(1);

  if (!forecast) {
    const fData = generateForecastData(instrument, timeframe);
    const [created] = await db.insert(forecastsTable).values({
      instrumentId: instrument.id,
      symbol,
      timeframe,
      ...fData,
      keyDrivers: JSON.stringify(fData.keyDrivers),
    }).returning();
    forecast = created;
  }

  res.json({
    ...forecast,
    keyDrivers: JSON.parse(forecast.keyDrivers as string),
    generatedAt: forecast.generatedAt.toISOString(),
  });
});

router.get("/instruments/:symbol/narrative/:timeframe", async (req, res) => {
  const { symbol } = GetNarrativeParams.parse(req.params);
  const { timeframe } = GetNarrativeParams.parse(req.params);

  const [instrument] = await db.select().from(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  if (!instrument) return res.status(404).json({ error: "Instrument not found" });

  let [narrative] = await db.select().from(narrativesTable).where(
    and(eq(narrativesTable.symbol, symbol), eq(narrativesTable.timeframe, timeframe))
  ).orderBy(desc(narrativesTable.generatedAt)).limit(1);

  if (!narrative) {
    const nData = generateNarrativeData(instrument, timeframe);
    const [created] = await db.insert(narrativesTable).values({
      instrumentId: instrument.id,
      symbol,
      timeframe,
      ...nData,
      keyLevels: JSON.stringify(nData.keyLevels),
      riskFactors: JSON.stringify(nData.riskFactors),
    }).returning();
    narrative = created;
  }

  res.json({
    ...narrative,
    keyLevels: JSON.parse(narrative.keyLevels as string),
    riskFactors: JSON.parse(narrative.riskFactors as string),
    generatedAt: narrative.generatedAt.toISOString(),
  });
});

router.post("/instruments/:symbol/narrative", async (req, res) => {
  const { symbol } = GenerateNarrativeParams.parse(req.params);
  const { timeframe } = GenerateNarrativeBody.parse(req.body);

  const [instrument] = await db.select().from(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  if (!instrument) return res.status(404).json({ error: "Instrument not found" });

  const nData = generateNarrativeData(instrument, timeframe);
  const [narrative] = await db.insert(narrativesTable).values({
    instrumentId: instrument.id,
    symbol,
    timeframe,
    ...nData,
    keyLevels: JSON.stringify(nData.keyLevels),
    riskFactors: JSON.stringify(nData.riskFactors),
  }).returning();

  await db.insert(activityEventsTable).values({
    symbol,
    eventType: "narrative_updated",
    title: `Narrative regenerated for ${symbol}`,
    description: nData.headline,
    severity: "info",
  });

  res.json({
    ...narrative,
    keyLevels: JSON.parse(narrative.keyLevels as string),
    riskFactors: JSON.parse(narrative.riskFactors as string),
    generatedAt: narrative.generatedAt.toISOString(),
  });
});

router.get("/instruments/:symbol/setups/:timeframe", async (req, res) => {
  const { symbol } = GetTradeSetupsParams.parse(req.params);
  const { timeframe } = GetTradeSetupsParams.parse(req.params);
  const setups = await db.select().from(tradeSetupsTable).where(
    and(eq(tradeSetupsTable.symbol, symbol), eq(tradeSetupsTable.timeframe, timeframe))
  ).orderBy(desc(tradeSetupsTable.createdAt));

  res.json(setups.map(s => ({
    ...s,
    takeProfits: JSON.parse(s.takeProfits as string),
    createdAt: s.createdAt.toISOString(),
  })));
});

router.post("/instruments/:symbol/analyze", async (req, res) => {
  const { symbol } = RunAnalysisParams.parse(req.params);
  const { timeframe } = RunAnalysisBody.parse(req.body);

  const [instrument] = await db.select().from(instrumentsTable).where(eq(instrumentsTable.symbol, symbol));
  if (!instrument) return res.status(404).json({ error: "Instrument not found" });

  const patternTypes = [
    "Bull Flag", "Bear Flag", "Head and Shoulders", "Double Top", "Double Bottom",
    "Ascending Triangle", "Descending Triangle", "Cup and Handle", "Wedge", "Channel Breakout",
  ];
  const directions = ["bullish", "bearish", "neutral"] as const;
  const statuses = ["forming", "confirmed"] as const;

  const numPatterns = Math.floor(Math.random() * 3) + 2;
  const patternsToInsert = Array.from({ length: numPatterns }, () => {
    const dir = directions[Math.floor(Math.random() * directions.length)];
    const now = new Date();
    const conf = 0.6 + Math.random() * 0.3;
    return {
      instrumentId: instrument.id,
      symbol,
      patternType: patternTypes[Math.floor(Math.random() * patternTypes.length)],
      direction: dir,
      confidence: conf,
      timeframe,
      startTime: new Date(now.getTime() - 24 * 3600000),
      endTime: now,
      description: `A ${dir} ${patternTypes[0]} pattern has formed with ${(conf * 100).toFixed(0)}% confidence based on price action and volume analysis.`,
      priceLevel: instrument.currentPrice * (1 + (Math.random() * 0.04 - 0.02)),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
  });

  const insertedPatterns = await db.insert(patternsTable).values(patternsToInsert).returning();

  const zoneTypes = ["support", "resistance", "order_block", "fair_value_gap", "liquidity_pool"] as const;
  const strengths = ["moderate", "strong", "extreme"] as const;
  const numZones = Math.floor(Math.random() * 3) + 3;
  const zonesToInsert = Array.from({ length: numZones }, (_, i) => {
    const offset = (i - 2) * 0.025;
    const priceLevel = instrument.currentPrice * (1 + offset);
    const range = priceLevel * 0.005;
    return {
      instrumentId: instrument.id,
      symbol,
      zoneType: zoneTypes[Math.floor(Math.random() * zoneTypes.length)],
      priceLevel,
      priceRangeHigh: priceLevel + range,
      priceRangeLow: priceLevel - range,
      strength: strengths[Math.floor(Math.random() * strengths.length)],
      timeframe,
      description: `Key ${zoneTypes[0]} zone identified via volume profile and order book analysis`,
      testedCount: Math.floor(Math.random() * 5),
      lastTested: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
    };
  });

  const insertedZones = await db.insert(liquidityZonesTable).values(zonesToInsert).returning();

  const setupsToInsert = Array.from({ length: 2 }, () => {
    const dir = Math.random() > 0.5 ? "long" : "short";
    const entry = instrument.currentPrice * (dir === "long" ? 1.005 : 0.995);
    const sl = entry * (dir === "long" ? 0.975 : 1.025);
    const tp1 = entry * (dir === "long" ? 1.025 : 0.975);
    const tp2 = entry * (dir === "long" ? 1.045 : 0.955);
    const rr = Math.abs(tp1 - entry) / Math.abs(entry - sl);
    return {
      instrumentId: instrument.id,
      symbol,
      direction: dir,
      setupType: dir === "long" ? "Breakout Long" : "Breakdown Short",
      entryPrice: entry,
      stopLoss: sl,
      takeProfits: JSON.stringify([tp1, tp2]),
      riskReward: rr,
      confidence: 0.65 + Math.random() * 0.2,
      timeframe,
      rationale: `Price action structure and liquidity mapping indicate a high-probability ${dir} setup. Entry above current consolidation with stop below structural support.`,
      status: "active",
    };
  });

  const insertedSetups = await db.insert(tradeSetupsTable).values(setupsToInsert).returning();

  await db.insert(activityEventsTable).values({
    symbol,
    eventType: "pattern_detected",
    title: `Analysis complete for ${symbol}`,
    description: `Found ${insertedPatterns.length} patterns, ${insertedZones.length} liquidity zones, and ${insertedSetups.length} trade setups on ${timeframe}`,
    severity: "info",
  });

  res.json({
    symbol,
    status: "complete",
    patternsFound: insertedPatterns.length,
    zonesFound: insertedZones.length,
    setupsFound: insertedSetups.length,
    message: `Analysis complete: ${insertedPatterns.length} patterns, ${insertedZones.length} zones, ${insertedSetups.length} setups identified`,
  });
});

export default router;
