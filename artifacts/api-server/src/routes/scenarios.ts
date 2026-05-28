import { Router } from "express";
import { db } from "@workspace/db";
import { scenarioSimulationsTable, scenarioPathsTable, instrumentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { RunSimulationBody, GetSimulationParams } from "@workspace/api-zod";

const router = Router();

interface ScenarioConfig {
  driftBias: number;
  volatilityMult: number;
  trendStrength: number;
  crashRisk: number;
  label: string;
}

const SCENARIO_CONFIGS: Record<string, ScenarioConfig> = {
  breakout_bull: {
    driftBias: 0.002,
    volatilityMult: 1.3,
    trendStrength: 0.7,
    crashRisk: 0.01,
    label: "Breakout Bull",
  },
  breakdown_bear: {
    driftBias: -0.002,
    volatilityMult: 1.4,
    trendStrength: 0.6,
    crashRisk: 0.05,
    label: "Breakdown Bear",
  },
  range_bound: {
    driftBias: 0.0,
    volatilityMult: 0.7,
    trendStrength: 0.1,
    crashRisk: 0.005,
    label: "Range Bound",
  },
  fed_rate_hike: {
    driftBias: -0.0015,
    volatilityMult: 1.6,
    trendStrength: 0.4,
    crashRisk: 0.08,
    label: "Fed Rate Hike",
  },
  market_crash: {
    driftBias: -0.005,
    volatilityMult: 2.5,
    trendStrength: 0.8,
    crashRisk: 0.25,
    label: "Market Crash",
  },
  institutional_accumulation: {
    driftBias: 0.0015,
    volatilityMult: 0.8,
    trendStrength: 0.5,
    crashRisk: 0.01,
    label: "Institutional Accumulation",
  },
  custom: {
    driftBias: 0.001,
    volatilityMult: 1.0,
    trendStrength: 0.3,
    crashRisk: 0.02,
    label: "Custom Scenario",
  },
};

const BASE_VOLATILITY: Record<string, number> = {
  "1m": 0.001,
  "5m": 0.002,
  "15m": 0.003,
  "1h": 0.006,
  "4h": 0.012,
  "1d": 0.022,
};

function geometricBrownianMotion(
  startPrice: number,
  steps: number,
  drift: number,
  sigma: number,
): number[] {
  const prices: number[] = [startPrice];
  let price = startPrice;
  for (let i = 0; i < steps; i++) {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    price = price * Math.exp((drift - 0.5 * sigma * sigma) + sigma * z);
    prices.push(price);
  }
  return prices;
}

function runMonteCarlo(
  startPrice: number,
  numPaths: number,
  horizon: number,
  config: ScenarioConfig,
  baseVol: number,
): number[][] {
  const sigma = baseVol * config.volatilityMult;
  const drift = config.driftBias;

  return Array.from({ length: numPaths }, () => {
    const hasCrash = Math.random() < config.crashRisk;
    const prices = geometricBrownianMotion(startPrice, horizon, drift, sigma);

    if (hasCrash) {
      const crashAt = Math.floor(Math.random() * horizon * 0.7) + Math.floor(horizon * 0.2);
      const crashMag = 0.05 + Math.random() * 0.15;
      for (let i = crashAt; i < prices.length; i++) {
        const decayFactor = Math.exp(-0.1 * (i - crashAt));
        prices[i] = prices[i] * (1 - crashMag * decayFactor);
      }
    }

    return prices;
  });
}

function classifyPath(startPrice: number, endPrice: number): { label: string; probability: number } {
  const ret = (endPrice - startPrice) / startPrice;
  if (ret > 0.03) return { label: "Strongly Bullish", probability: Math.random() * 0.3 + 0.7 };
  if (ret > 0.01) return { label: "Mildly Bullish", probability: Math.random() * 0.2 + 0.5 };
  if (ret > -0.01) return { label: "Neutral", probability: Math.random() * 0.2 + 0.4 };
  if (ret > -0.03) return { label: "Mildly Bearish", probability: Math.random() * 0.2 + 0.5 };
  return { label: "Strongly Bearish", probability: Math.random() * 0.3 + 0.7 };
}

function computeSummary(startPrice: number, allPaths: number[][]) {
  const endPrices = allPaths.map(p => p[p.length - 1]);
  const returns = endPrices.map(e => (e - startPrice) / startPrice);

  const bullish = returns.filter(r => r > 0.01).length / returns.length;
  const bearish = returns.filter(r => r < -0.01).length / returns.length;
  const neutral = 1 - bullish - bearish;

  const sorted = [...endPrices].sort((a, b) => a - b);
  const lo = sorted[Math.floor(sorted.length * 0.025)];
  const hi = sorted[Math.floor(sorted.length * 0.975)];
  const mean = endPrices.reduce((s, v) => s + v, 0) / endPrices.length;

  return {
    bullishProbability: bullish,
    bearishProbability: bearish,
    neutralProbability: neutral,
    expectedReturn: (mean - startPrice) / startPrice * 100,
    maxUpside: (sorted[sorted.length - 1] - startPrice) / startPrice * 100,
    maxDownside: (sorted[0] - startPrice) / startPrice * 100,
    confidenceInterval95High: hi,
    confidenceInterval95Low: lo,
  };
}

router.post("/scenarios/simulate", async (req, res) => {
  const body = RunSimulationBody.parse(req.body);
  const { symbol, scenarioType, timeframe } = body;
  const numPaths = body.numPaths ?? 20;
  const horizonCandles = body.horizonCandles ?? 50;
  const customPrompt = body.customPrompt ?? "";

  const [instrument] = await db.select()
    .from(instrumentsTable)
    .where(eq(instrumentsTable.symbol, symbol));

  const startPrice = instrument?.currentPrice ?? 100;
  const config = SCENARIO_CONFIGS[scenarioType] ?? SCENARIO_CONFIGS.custom;
  const baseVol = BASE_VOLATILITY[timeframe] ?? 0.006;

  const allPaths = runMonteCarlo(startPrice, numPaths, horizonCandles, config, baseVol);
  const summary = computeSummary(startPrice, allPaths);

  const [simulation] = await db.insert(scenarioSimulationsTable).values({
    symbol,
    scenarioType,
    customPrompt,
    timeframe,
    numPaths,
    horizonCandles,
  }).returning();

  const pathRows = allPaths.map((prices, i) => {
    const endPrice = prices[prices.length - 1];
    const { label, probability } = classifyPath(startPrice, endPrice);
    return {
      simulationId: simulation.id,
      pathIndex: i,
      label,
      probability,
      prices: JSON.stringify(prices.map(p => Math.round(p * 100) / 100)),
    };
  });

  const insertedPaths = await db.insert(scenarioPathsTable).values(pathRows).returning();

  res.json({
    simulation: { ...simulation, createdAt: simulation.createdAt.toISOString() },
    paths: insertedPaths.map(p => ({
      ...p,
      prices: JSON.parse(p.prices as string),
      createdAt: p.createdAt.toISOString(),
    })),
    summary,
  });
});

router.get("/scenarios/:id", async (req, res) => {
  const { id } = GetSimulationParams.parse(req.params);

  const [simulation] = await db.select()
    .from(scenarioSimulationsTable)
    .where(eq(scenarioSimulationsTable.id, id));

  if (!simulation) return res.status(404).json({ error: "Simulation not found" });

  const paths = await db.select()
    .from(scenarioPathsTable)
    .where(eq(scenarioPathsTable.simulationId, id));

  const [instrument] = await db.select()
    .from(instrumentsTable)
    .where(eq(instrumentsTable.symbol, simulation.symbol));

  const startPrice = instrument?.currentPrice ?? 100;
  const parsedPaths = paths.map(p => ({
    ...p,
    prices: JSON.parse(p.prices as string) as number[],
    createdAt: p.createdAt.toISOString(),
  }));

  const summary = computeSummary(startPrice, parsedPaths.map(p => p.prices));

  res.json({
    simulation: { ...simulation, createdAt: simulation.createdAt.toISOString() },
    paths: parsedPaths,
    summary,
  });
});

router.get("/scenarios", async (_req, res) => {
  const simulations = await db.select()
    .from(scenarioSimulationsTable)
    .orderBy(desc(scenarioSimulationsTable.createdAt))
    .limit(20);

  res.json(simulations.map(s => ({ ...s, createdAt: s.createdAt.toISOString() })));
});

export default router;
