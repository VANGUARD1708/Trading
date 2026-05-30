import { useListInstruments } from "@workspace/api-client-react";
import { useLivePrices } from "@/hooks/use-live-prices";
import { TrendingUp, TrendingDown } from "lucide-react";

export function TickerTape() {
  const { data: instruments } = useListInstruments({ query: { refetchInterval: 60_000 } });
  const { prices, flashes } = useLivePrices(3000);

  if (!instruments || instruments.length === 0) return null;

  const items = instruments.map((inst) => {
    const live = prices.get(inst.symbol);
    const price = live?.price ?? inst.currentPrice;
    const changePct = live?.changePct24h ?? inst.priceChangePct24h;
    const flash = flashes.get(inst.symbol);
    const up = changePct >= 0;

    return (
      <span key={inst.symbol} className="inline-flex items-center gap-1.5 px-4">
        <span className="text-muted-foreground text-[10px]">{inst.symbol}</span>
        <span
          className="font-mono text-[11px] font-bold transition-colors duration-150"
          style={{
            color:
              flash === "up"
                ? "hsl(142,71%,55%)"
                : flash === "down"
                ? "hsl(0,84%,65%)"
                : "hsl(var(--foreground))",
            textShadow:
              flash === "up"
                ? "0 0 8px hsla(142,71%,45%,0.9)"
                : flash === "down"
                ? "0 0 8px hsla(0,84%,60%,0.9)"
                : undefined,
          }}
        >
          ${price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: price < 1 ? 6 : price < 100 ? 4 : 2,
          })}
        </span>
        <span
          className={`inline-flex items-center gap-0.5 font-mono text-[10px] ${
            up ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {up ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
        <span className="text-border mx-2 text-[10px]">◆</span>
      </span>
    );
  });

  return (
    <div className="w-full h-7 bg-card/80 border-b border-border overflow-hidden flex items-center relative z-30">
      <div
        className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to right, hsl(var(--card)) 0%, transparent 100%)" }}
      />
      <div className="ticker-inner">{items}{items}</div>
      <div
        className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
        style={{ background: "linear-gradient(to left, hsl(var(--card)) 0%, transparent 100%)" }}
      />
    </div>
  );
}