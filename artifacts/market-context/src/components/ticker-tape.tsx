import { useListInstruments } from "@workspace/api-client-react";
import { TrendingUp, TrendingDown } from "lucide-react";

export function TickerTape() {
  const { data: instruments } = useListInstruments({
    query: { refetchInterval: 30_000 },
  });

  if (!instruments || instruments.length === 0) return null;

  const items = instruments.map((inst) => {
    const up = inst.priceChangePct24h >= 0;
    return (
      <span key={inst.symbol} className="inline-flex items-center gap-1.5 px-4">
        <span className="text-muted-foreground text-[10px]">{inst.symbol}</span>
        <span className="font-mono text-[11px] font-bold text-foreground">
          ${inst.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
        </span>
        <span className={`inline-flex items-center gap-0.5 font-mono text-[10px] ${up ? "text-emerald-400" : "text-red-400"}`}>
          {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
          {up ? "+" : ""}{inst.priceChangePct24h.toFixed(2)}%
        </span>
        <span className="text-border mx-2 text-[10px]">◆</span>
      </span>
    );
  });

  return (
    <div className="w-full h-7 bg-card/80 border-b border-border overflow-hidden flex items-center relative z-30">
      <div className="absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
           style={{ background: "linear-gradient(to right, hsl(var(--card)) 0%, transparent 100%)" }} />
      <div className="ticker-inner">
        {items}
        {items}
      </div>
      <div className="absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none"
           style={{ background: "linear-gradient(to left, hsl(var(--card)) 0%, transparent 100%)" }} />
    </div>
  );
}
