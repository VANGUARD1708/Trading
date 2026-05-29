import { useListInstruments } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, ArrowUpRight, ArrowDownRight, Circle } from "lucide-react";

const SENTIMENT_COLOR: Record<string, string> = {
  strongly_bullish: "text-emerald-400",
  bullish:          "text-green-400",
  neutral:          "text-yellow-400",
  bearish:          "text-orange-400",
  strongly_bearish: "text-red-400",
};

const SENTIMENT_DOT: Record<string, string> = {
  strongly_bullish: "bg-emerald-400",
  bullish:          "bg-green-400",
  neutral:          "bg-yellow-400",
  bearish:          "bg-orange-400",
  strongly_bearish: "bg-red-400",
};

const SENTIMENT_BARS: Record<string, number> = {
  strongly_bullish: 5, bullish: 4, neutral: 3, bearish: 2, strongly_bearish: 1,
};

export default function Watchlist() {
  const { data: instruments, isLoading } = useListInstruments();

  const maxVol = instruments ? Math.max(...instruments.map((i) => i.volume24h)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 pb-8 max-w-6xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-2xl font-black tracking-[0.15em] text-primary glow-text-primary glitch-text"
            data-text="ASSET MONITOR"
          >
            ASSET MONITOR
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider mt-0.5">
            TRACKING {instruments?.length ?? "—"} INSTRUMENTS · LIVE SENTIMENT FEED
          </p>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/50 text-right space-y-0.5">
          <div className="flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-emerald-400 status-pulse" />
            FEED ACTIVE
          </div>
          <div>LAST SYNC: NOW</div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-border bg-card/40 overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[2fr_2.5fr_2fr_1.5fr_1.5fr_2fr_1fr] gap-0 px-5 py-2.5 border-b border-border/60 text-[9px] font-mono font-bold tracking-[0.15em] text-muted-foreground/50 uppercase">
          <span>Symbol</span>
          <span>Name</span>
          <span className="text-right">Price</span>
          <span className="text-right">24h Chg</span>
          <span className="text-right">Volume</span>
          <span className="text-center">Sentiment</span>
          <span />
        </div>

        {/* Rows */}
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-border/20">
              <Skeleton className="h-5 w-full" />
            </div>
          ))
        ) : (
          instruments?.map((inst, i) => {
            const isUp = inst.priceChangePct24h >= 0;
            const sentColor = SENTIMENT_COLOR[inst.marketSentiment] ?? "text-muted-foreground";
            const dotColor = SENTIMENT_DOT[inst.marketSentiment] ?? "bg-muted";
            const bars = SENTIMENT_BARS[inst.marketSentiment] ?? 3;
            const volPct = (inst.volume24h / maxVol) * 100;

            return (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/instruments/${inst.symbol}`}>
                  <div className="grid grid-cols-[2fr_2.5fr_2fr_1.5fr_1.5fr_2fr_1fr] gap-0 items-center px-5 py-3.5 border-b border-border/20 last:border-0 data-row cursor-pointer group">

                    {/* Symbol + active dot */}
                    <div className="flex items-center gap-2.5">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
                      <span className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {inst.symbol}
                      </span>
                    </div>

                    {/* Name */}
                    <span className="font-sans text-xs text-muted-foreground truncate pr-4">{inst.name}</span>

                    {/* Price */}
                    <span className="font-mono text-sm text-right text-foreground tabular-nums">
                      ${inst.currentPrice.toLocaleString(undefined, {
                        minimumFractionDigits: inst.currentPrice < 1 ? 4 : 2,
                        maximumFractionDigits: inst.currentPrice < 1 ? 6 : 2,
                      })}
                    </span>

                    {/* 24h change */}
                    <div className={`flex items-center justify-end gap-1 font-mono text-sm tabular-nums ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp
                        ? <ArrowUpRight className="h-3.5 w-3.5" />
                        : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {Math.abs(inst.priceChangePct24h).toFixed(2)}%
                    </div>

                    {/* Volume bar */}
                    <div className="flex items-center justify-end gap-2 pr-2">
                      <div className="w-16 h-1 bg-muted/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/50 rounded-full transition-all duration-700"
                          style={{ width: `${volPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Sentiment bars */}
                    <div className="flex items-center justify-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div
                          key={j}
                          className={`rounded-full transition-all ${j < bars ? dotColor : "bg-muted/40"}`}
                          style={{ width: 6, height: 6 + j * 2 }}
                        />
                      ))}
                      <span className={`ml-2 text-[9px] font-mono capitalize ${sentColor}`}>
                        {inst.marketSentiment.replace(/_/g, " ")}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-end">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer status */}
      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/40 px-1">
        <span>NEXUSFLOW ASSET MONITOR · REAL-TIME DATA</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400 status-pulse" />
          STREAMING
        </span>
      </div>
    </motion.div>
  );
}
