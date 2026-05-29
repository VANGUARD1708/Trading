import { useListInstruments } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useLivePrices } from "@/hooks/use-live-prices";
import { Sparkline } from "@/components/sparkline";
import { AlertBell } from "@/components/alert-bell";

const SENTIMENT_COLOR: Record<string, string> = {
  strongly_bullish: "text-emerald-400", bullish: "text-green-400",
  neutral: "text-yellow-400", bearish: "text-orange-400", strongly_bearish: "text-red-400",
};
const SENTIMENT_DOT: Record<string, string> = {
  strongly_bullish: "bg-emerald-400", bullish: "bg-green-400",
  neutral: "bg-yellow-400", bearish: "bg-orange-400", strongly_bearish: "bg-red-400",
};
const SENTIMENT_BARS: Record<string, number> = {
  strongly_bullish: 5, bullish: 4, neutral: 3, bearish: 2, strongly_bearish: 1,
};

export default function Watchlist() {
  const { data: instruments, isLoading } = useListInstruments();
  const { prices, flashes } = useLivePrices(3000);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-[0.15em] text-primary glow-text-primary glitch-text" data-text="ASSET MONITOR">
            ASSET MONITOR
          </h1>
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider mt-0.5">
            TRACKING {instruments?.length ?? "—"} INSTRUMENTS · LIVE PRICE FEED ACTIVE
          </p>
        </div>
        <div className="text-[9px] font-mono text-muted-foreground/50 text-right space-y-0.5">
          <div className="flex items-center gap-1 justify-end">
            <span className="w-1 h-1 rounded-full bg-emerald-400 status-pulse" />
            FEED ACTIVE · 3s REFRESH
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-sm border border-border bg-card/40 overflow-hidden">
        <div className="grid grid-cols-[2fr_2fr_100px_2fr_1.5fr_2fr_auto] gap-0 px-5 py-2.5 border-b border-border/60 text-[9px] font-mono font-bold tracking-[0.15em] text-muted-foreground/50 uppercase">
          <span>Symbol</span>
          <span>Name</span>
          <span className="text-center">7D Trend</span>
          <span className="text-right">Live Price</span>
          <span className="text-right">24h Chg</span>
          <span className="text-center">Sentiment</span>
          <span className="text-right pr-2">Alert</span>
        </div>

        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-border/20">
              <Skeleton className="h-5 w-full" />
            </div>
          ))
        ) : (
          instruments?.map((inst, i) => {
            const live = prices.get(inst.symbol);
            const flash = flashes.get(inst.symbol);
            const price = live?.price ?? inst.currentPrice;
            const changePct = live?.changePct24h ?? inst.priceChangePct24h;
            const isUp = changePct >= 0;
            const sentColor = SENTIMENT_COLOR[inst.marketSentiment] ?? "text-muted-foreground";
            const dotColor = SENTIMENT_DOT[inst.marketSentiment] ?? "bg-muted";
            const bars = SENTIMENT_BARS[inst.marketSentiment] ?? 3;

            return (
              <motion.div
                key={inst.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div
                  className="grid grid-cols-[2fr_2fr_100px_2fr_1.5fr_2fr_auto] gap-0 items-center px-5 py-3.5 border-b border-border/20 last:border-0 group transition-all duration-150"
                  style={{
                    background:
                      flash === "up" ? "hsla(142,71%,45%,0.05)" :
                      flash === "down" ? "hsla(0,84%,60%,0.05)" :
                      undefined,
                    boxShadow:
                      flash === "up" ? "inset 2px 0 0 hsla(142,71%,45%,0.8)" :
                      flash === "down" ? "inset 2px 0 0 hsla(0,84%,60%,0.8)" :
                      "inset 2px 0 0 transparent",
                  }}
                >
                  {/* Symbol — clickable */}
                  <Link href={`/instruments/${inst.symbol}`}>
                    <div className="flex items-center gap-2.5 cursor-pointer">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor} ${flash ? "status-pulse" : ""}`} />
                      <span className="font-mono font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                        {inst.symbol}
                      </span>
                    </div>
                  </Link>

                  {/* Name */}
                  <Link href={`/instruments/${inst.symbol}`}>
                    <span className="font-sans text-xs text-muted-foreground truncate pr-4 cursor-pointer hover:text-foreground transition-colors">{inst.name}</span>
                  </Link>

                  {/* Sparkline */}
                  <div className="flex items-center justify-center">
                    <Sparkline
                      symbol={inst.symbol}
                      currentPrice={price}
                      changePct={changePct}
                      width={80}
                      height={28}
                    />
                  </div>

                  {/* Live price */}
                  <Link href={`/instruments/${inst.symbol}`}>
                    <div className="text-right cursor-pointer">
                      <span
                        className="font-mono text-sm tabular-nums transition-all duration-150"
                        style={{
                          color: flash === "up" ? "hsl(142,71%,55%)" : flash === "down" ? "hsl(0,84%,65%)" : "hsl(var(--foreground))",
                          textShadow: flash === "up" ? "0 0 8px hsla(142,71%,45%,0.8)" : flash === "down" ? "0 0 8px hsla(0,84%,60%,0.8)" : undefined,
                        }}
                      >
                        ${price.toLocaleString(undefined, {
                          minimumFractionDigits: price < 1 ? 4 : 2,
                          maximumFractionDigits: price < 1 ? 6 : 2,
                        })}
                      </span>
                      {flash && (
                        <span className={`ml-1 text-[9px] font-mono ${flash === "up" ? "text-emerald-400" : "text-red-400"}`}>
                          {flash === "up" ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* 24h change */}
                  <Link href={`/instruments/${inst.symbol}`}>
                    <div className={`flex items-center justify-end gap-1 font-mono text-sm tabular-nums cursor-pointer ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                      {isUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                      {Math.abs(changePct).toFixed(2)}%
                    </div>
                  </Link>

                  {/* Sentiment */}
                  <Link href={`/instruments/${inst.symbol}`}>
                    <div className="flex items-center justify-center gap-0.5 cursor-pointer">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className={`rounded-full transition-all ${j < bars ? dotColor : "bg-muted/40"}`}
                          style={{ width: 6, height: 6 + j * 2 }} />
                      ))}
                      <span className={`ml-2 text-[9px] font-mono capitalize hidden xl:block ${sentColor}`}>
                        {inst.marketSentiment.replace(/_/g, " ")}
                      </span>
                    </div>
                  </Link>

                  {/* Alert bell + arrow */}
                  <div className="flex items-center justify-end gap-1 pl-3">
                    <AlertBell symbol={inst.symbol} currentPrice={price} size="sm" />
                    <Link href={`/instruments/${inst.symbol}`}>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors cursor-pointer" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground/40 px-1">
        <span>NEXUSFLOW ASSET MONITOR · LIVE DATA ENGINE ACTIVE</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-400 status-pulse" />
          STREAMING · 3s TICK
        </span>
      </div>
    </motion.div>
  );
}
