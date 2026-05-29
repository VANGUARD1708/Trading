import { useState, useEffect, useRef } from "react";

export interface PriceTick {
  symbol: string;
  price: number;
  prevPrice: number;
  changePct24h: number;
  direction: "up" | "down" | "flat";
  velocity: number;
}

export type FlashDir = "up" | "down";

export function useLivePrices(intervalMs = 3000) {
  const [prices, setPrices] = useState<Map<string, PriceTick>>(new Map());
  const [flashes, setFlashes] = useState<Map<string, FlashDir>>(new Map());
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchPrices() {
      if (!active) return;
      try {
        const base = (window as any).__API_BASE__ ?? "";
        const res = await fetch(`${base}/api/live-prices`);
        if (!res.ok) return;
        const ticks: PriceTick[] = await res.json();

        setPrices((prev) => {
          const next = new Map(prev);
          const newFlashes = new Map<string, FlashDir>();

          for (const tick of ticks) {
            const old = prev.get(tick.symbol);
            if (old && Math.abs(tick.price - old.price) > 0.000001) {
              newFlashes.set(tick.symbol, tick.direction === "up" ? "up" : "down");
            }
            next.set(tick.symbol, tick);
          }

          if (newFlashes.size > 0) {
            setFlashes(newFlashes);
            if (flashTimer.current) clearTimeout(flashTimer.current);
            flashTimer.current = setTimeout(() => setFlashes(new Map()), 700);
          }

          return next;
        });
      } catch {
        /* network errors ignored */
      }
    }

    fetchPrices();
    const id = setInterval(fetchPrices, intervalMs);
    return () => {
      active = false;
      clearInterval(id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
    };
  }, [intervalMs]);

  return { prices, flashes };
}
