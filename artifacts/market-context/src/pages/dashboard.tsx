import {
  useGetDashboardSummary,
  useGetTopSetups,
  useGetRecentActivity,
  useListInstruments,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  Target, TrendingUp, TrendingDown, Zap, Activity,
  AlertTriangle, AlertCircle, Info, ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { HudStat } from "@/components/hud-stat";
import { IntelligenceBrief } from "@/components/intelligence-brief";
import { SmartScan } from "@/components/smart-scan";
import { useLivePrices } from "@/hooks/use-live-prices";
import { PriceFlash } from "@/components/price-flash";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

/* ─── Market regime badge ───────────────────────────────────────── */
function MarketRegimeBadge() {
  const { data } = useQuery({
    queryKey: ["market-regime"],
    queryFn: async () => {
      const base = (window as any).__API_BASE__ ?? "";
      const res = await fetch(`${base}/api/dashboard/market-regime`);
      return res.json();
    },
    refetchInterval: 60_000,
  });

  if (!data) return null;

  const colorMap: Record<string, string> = {
    emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    red:     "text-red-400 border-red-500/30 bg-red-500/10",
    yellow:  "text-yellow-400 border-yellow-500/30 bg-yellow-500/10",
    orange:  "text-orange-400 border-orange-500/30 bg-orange-500/10",
    cyan:    "text-primary border-primary/30 bg-primary/10",
  };

  return (
    <div className={`text-[9px] font-mono font-bold px-2.5 py-1 rounded-full border tracking-widest ${colorMap[data.color] ?? colorMap.cyan}`}>
      ◆ {data.regime}
    </div>
  );
}

/* ─── Sentiment matrix with live prices ────────────────────────── */
function SentimentMatrix() {
  const { data: instruments } = useListInstruments();
  const { prices, flashes } = useLivePrices(3000);

  if (!instruments) return null;

  const sentimentToNum: Record<string, number> = {
    strongly_bullish: 100, bullish: 75, neutral: 50, bearish: 25, strongly_bearish: 0,
  };

  return (
    <div className="rounded-sm border border-border bg-card/40 p-4">
      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3 flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-primary inline-block" />
        Sentiment Matrix
      </div>
      <div className="space-y-2">
        {instruments.map((inst) => {
          const score = sentimentToNum[inst.marketSentiment] ?? 50;
          const live = prices.get(inst.symbol);
          const flash = flashes.get(inst.symbol);
          const changePct = live?.changePct24h ?? inst.priceChangePct24h;
          const isUp = changePct >= 0;
          return (
            <Link key={inst.symbol} href={`/instruments/${inst.symbol}`}>
              <div className="flex items-center gap-3 group cursor-pointer hover:bg-white/3 rounded-sm px-1 py-0.5 transition-all">
                <span className="font-mono text-xs w-20 text-foreground group-hover:text-primary transition-colors">{inst.symbol}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted/50 flex">
                  <div className="h-full transition-all duration-700"
                    style={{ width: `${score}%`, background: "linear-gradient(to right, hsl(142,71%,45%), hsl(160,80%,40%))" }} />
                  <div className="h-full transition-all duration-700"
                    style={{ width: `${100 - score}%`, background: "linear-gradient(to right, hsl(0,70%,40%), hsl(0,84%,60%))" }} />
                </div>
                <span className={`font-mono text-[10px] w-14 text-right transition-colors ${isUp ? "text-emerald-400" : "text-red-400"} ${flash === "up" ? "text-emerald-300" : flash === "down" ? "text-red-300" : ""}`}>
                  {isUp ? "+" : ""}{changePct.toFixed(2)}%
                </span>
                <span className="text-[9px] capitalize text-muted-foreground w-20 truncate">{inst.marketSentiment.replace(/_/g, " ")}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Terminal feed ─────────────────────────────────────────────── */
function TerminalFeed() {
  const { data: activities, isLoading } = useGetRecentActivity();
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [activities]);

  const typeConfig: Record<string, { color: string; label: string }> = {
    setup_triggered:   { color: "text-primary",    label: "SETUP" },
    pattern_detected:  { color: "text-yellow-400", label: "PTTRN" },
    narrative_updated: { color: "text-purple-400", label: "NRTV." },
    price_alert:       { color: "text-orange-400", label: "PRICE" },
  };

  return (
    <div className="rounded-sm border border-border bg-card/40 flex flex-col h-full min-h-[320px]">
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">System Log</span>
        <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">LIVE</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 font-mono text-[10px] scrollbar-hide">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full mb-1.5" />)
          : activities?.map((a, i) => {
              const typ = typeConfig[a.eventType] ?? { color: "text-muted-foreground", label: "SYS.." };
              const time = new Date(a.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-start gap-1.5 py-0.5 border-b border-border/20 last:border-0 hover:bg-white/3 px-1 rounded-sm"
                >
                  <span className="text-muted-foreground/50 shrink-0 tabular-nums">{time}</span>
                  <span className={`shrink-0 ${typ.color}`}>[{typ.label}]</span>
                  <span className="text-primary/80 shrink-0">{a.symbol}</span>
                  <span className="text-muted-foreground truncate">{a.title}</span>
                </motion.div>
              );
            })}
        <div ref={endRef} className="terminal-cursor h-3" />
      </div>
    </div>
  );
}

/* ─── Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: topSetups, isLoading: isLoadingSetups } = useGetTopSetups();
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5 pb-8 max-w-7xl mx-auto">

      {/* ─── Header ──────────────────────────────────────── */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-0.5 flex-wrap">
            <h1 className="text-2xl font-black tracking-[0.15em] text-primary glow-text-primary glitch-text" data-text="COMMAND CENTER">
              COMMAND CENTER
            </h1>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 tracking-widest">
              ONLINE
            </span>
            <MarketRegimeBadge />
          </div>
          <p className="text-[10px] font-mono text-muted-foreground tracking-wider">{dateStr.toUpperCase()} · ALL SYSTEMS NOMINAL</p>
        </div>
        <div className="flex items-center gap-3">
          <SmartScan />
          <div className="text-[9px] font-mono text-muted-foreground/50 text-right hidden md:block">
            <div>NEXUSFLOW OS v2.4.0-α</div>
            <div>QUANTUM ANALYSIS ENGINE</div>
          </div>
        </div>
      </div>

      {/* ─── HUD Metrics ─────────────────────────────────── */}
      <div className="rounded-sm border border-border bg-card/40 p-4">
        <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-4 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-primary inline-block" /> System Metrics
        </div>
        <div className="flex items-center justify-around gap-4 flex-wrap">
          {isLoadingSummary ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="w-24 h-24 rounded-full" />
                <Skeleton className="w-16 h-3" />
              </div>
            ))
          ) : summary ? (
            <>
              <HudStat label="Instruments" value={summary.totalInstruments} pct={summary.totalInstruments / 20} color="cyan" size={108} />
              <HudStat label="Active Setups" value={summary.activeSetupsCount} pct={summary.activeSetupsCount / 10} color="orange" size={108} />
              <HudStat label="Avg Confidence" value={`${Math.round(summary.avgConfidence * 100)}%`} pct={summary.avgConfidence} color="emerald" size={108} />
              <HudStat label="High-Conf Patterns" value={summary.highConfidencePatterns} pct={summary.highConfidencePatterns / 15} color="cyan" size={108} />
              <div className="flex flex-col items-center gap-1 min-w-[108px]">
                <div className="w-[108px] h-[108px] rounded-full border border-border flex flex-col items-center justify-center bg-card/50 relative">
                  <div className="absolute inset-2 rounded-full border border-dashed border-primary/10" />
                  {summary.topMoverPct >= 0
                    ? <TrendingUp className="h-5 w-5 text-emerald-400 mb-1" />
                    : <TrendingDown className="h-5 w-5 text-red-400 mb-1" />}
                  <span className="font-mono font-bold text-sm text-foreground">{summary.topMover}</span>
                  <span className={`font-mono text-[10px] ${summary.topMoverPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {summary.topMoverPct >= 0 ? "+" : ""}{summary.topMoverPct}%
                  </span>
                </div>
                <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">Top Mover</span>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* ─── AI Intelligence Brief ───────────────────────── */}
      <IntelligenceBrief />

      {/* ─── AI Quant Layer ───────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="rounded-sm border border-border bg-card/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">
            Best Trade Right Now
          </div>

          <div className="text-2xl font-black text-primary">
            BTC/USD
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Highest confidence opportunity detected.
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">
            Reversal Probability
          </div>

          <div className="text-2xl font-black text-yellow-400">
            68%
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Current probability of trend reversal.
          </div>
        </div>

        <div className="rounded-sm border border-border bg-card/40 p-4">
          <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3">
            AI Confidence
          </div>

          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-400"
              style={{ width: "84%" }}
            />
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Quant engine confidence: 84%
          </div>
        </div>

      </div>

      {/* ─── Signals + Terminal ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-sm border border-border bg-card/40 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
            <Target className="h-3.5 w-3.5 text-primary" />
            <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">High-Conviction Signals</span>
            <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">{topSetups?.length ?? 0} ACTIVE</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border/40 text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                  <th className="text-left px-4 py-2">#</th>
                  <th className="text-left px-2 py-2">Asset</th>
                  <th className="text-left px-2 py-2">Dir</th>
                  <th className="text-left px-2 py-2">Type</th>
                  <th className="text-right px-2 py-2">R:R</th>
                  <th className="text-right px-2 py-2">Conf</th>
                  <th className="text-right px-4 py-2">TF</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingSetups ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-4 py-2"><Skeleton className="h-5 w-full" /></td></tr>
                  ))
                ) : topSetups?.map((setup, i) => (
                  <motion.tr
                    key={setup.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="border-b border-border/20 last:border-0 data-row cursor-pointer"
                    onClick={() => window.location.assign(`/instruments/${setup.symbol}`)}
                  >
                    <td className="px-4 py-3 text-muted-foreground/40">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-2 py-3"><span className="text-foreground font-bold">{setup.symbol}</span></td>
                    <td className="px-2 py-3">
                      <span className={`px-2 py-0.5 rounded-sm text-[9px] font-bold tracking-widest ${setup.direction === "long" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-red-500/15 text-red-400 border border-red-500/20"}`}>
                        {setup.direction.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-2 py-3 text-muted-foreground max-w-[140px] truncate">{setup.setupType}</td>
                    <td className="px-2 py-3 text-right text-primary">1:{setup.riskReward}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${setup.confidence * 100}%`, background: setup.confidence > 0.8 ? "hsl(142,71%,45%)" : setup.confidence > 0.6 ? "hsl(45,100%,55%)" : "hsl(0,84%,60%)" }} />
                        </div>
                        <span className="text-[9px] text-muted-foreground w-8 text-right">{Math.round(setup.confidence * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground text-[9px] tracking-widest">{setup.timeframe}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {topSetups && topSetups.length > 0 && (
            <div className="px-4 py-2 border-t border-border/40">
              <Link href="/watchlist" className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors font-mono tracking-wider">
                VIEW ALL INSTRUMENTS <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
        <TerminalFeed />
      </div>

      {/* ─── Sentiment Matrix ────────────────────────────── */}
      <SentimentMatrix />
    </motion.div>
  );
}
