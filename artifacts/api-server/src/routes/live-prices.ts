import { Router } from "express";
import { db } from "@workspace/db";
import { instrumentsTable } from "@workspace/db";

const router = Router();

interface PriceState {
  price: number;
  prevPrice: number;
  drift: number;
  driftExpiry: number;
  basePrice: number;
}

const priceState = new Map<string, PriceState>();

function tickPrice(symbol: string, basePrice: number): PriceState {
  let state = priceState.get(symbol);
  if (!state) {
    state = {
      price: basePrice,
      prevPrice: basePrice,
      drift: (Math.random() - 0.5) * 2,
      driftExpiry: Date.now() + Math.random() * 12000 + 4000,
      basePrice,
    };
    priceState.set(symbol, state);
  }

  if (Date.now() > state.driftExpiry) {
    state.drift = (Math.random() - 0.5) * 2;
    state.driftExpiry = Date.now() + Math.random() * 18000 + 5000;
  }

  state.prevPrice = state.price;

  const volatility = state.price * 0.0005;
  const driftComponent = state.drift * volatility * 0.45;
  const noiseComponent = (Math.random() - 0.5) * volatility;
  const meanReversion = (state.basePrice - state.price) * 0.0008;

  state.price = Math.max(state.basePrice * 0.93, state.price + driftComponent + noiseComponent + meanReversion);

  return state;
}

router.get("/live-prices", async (_req, res) => {
  const instruments = await db.select().from(instrumentsTable);

  const ticks = instruments.map((inst) => {
    const state = tickPrice(inst.symbol, inst.currentPrice);
    const direction: "up" | "down" | "flat" =
      state.price > state.prevPrice ? "up" : state.price < state.prevPrice ? "down" : "flat";
    const velocity = Math.abs(state.price - state.prevPrice) / state.prevPrice * 100;
    const livePctChange =
      ((state.price - inst.currentPrice) / inst.currentPrice) * 100;

    return {
      symbol: inst.symbol,
      price: parseFloat(state.price.toFixed(inst.currentPrice < 10 ? 6 : inst.currentPrice < 1000 ? 4 : 2)),
      prevPrice: parseFloat(state.prevPrice.toFixed(inst.currentPrice < 10 ? 6 : inst.currentPrice < 1000 ? 4 : 2)),
      changePct24h: parseFloat((inst.priceChangePct24h + livePctChange).toFixed(3)),
      direction,
      velocity: parseFloat(velocity.toFixed(5)),
    };
  });

  res.json(ticks);
});

export default router;
