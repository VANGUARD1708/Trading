import { useState } from "react";
import { useParams } from "wouter";
import {
  useGetInstrument, useGetCandles, useGetPatterns, useGetForecast,
  useGetNarrative, useGetTradeSetups, useGetLiquidityZones, useRunAnalysis, useGenerateNarrative,
  getGetInstrumentQueryKey, getGetCandlesQueryKey, getGetPatternsQueryKey, getGetForecastQueryKey,
  getGetNarrativeQueryKey, getGetTradeSetupsQueryKey, getGetLiquidityZonesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Zap, TrendingUp, TrendingDown, AlertTriangle, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { SentimentBadge } from "@/components/sentiment-badge";
import { ConfidenceBar } from "@/components/confidence-bar";
import { CandlestickChart } from "@/components/candlestick-chart";
import { PositionCalculator } from "@/components/position-calculator";
import { useLivePrices } from "@/hooks/use-live-prices";
import { motion } from "framer-motion";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"] as const;
type TF = (typeof TIMEFRAMES)[number];

const ZONE_BG: Record<string, string> = {
  support: "bg-emerald-500/10 border-emerald-500/20", resistance: "bg-red-500/10 border-red-500/20",
  order_block: "bg-yellow-500/10 border-yellow-500/20", fair_value_gap: "bg-blue-500/10 border-blue-500/20",
  liquidity_pool: "bg-primary/10 border-primary/20",
};
const ZONE_COLOR: Record<string, string> = {
  support: "text-emerald-400", resistance: "text-red-400", order_block: "text-yellow-400",
  fair_value_gap: "text-blue-400", liquidity_pool: "text-primary",
};

export default function InstrumentDetail() {
  const { symbol } = useParams();
  const [timeframe, setTimeframe] = useState<TF>("1h");
  const queryClient = useQueryClient();
  const safeSymbol = symbol || "";
  const { prices, flashes } = useLivePrices(3000);

  const { data: instrument, isLoading: isLoadingInstrument } = useGetInstrument(safeSymbol, {
    query: { enabled: !!safeSymbol, queryKey: getGetInstrumentQueryKey(safeSymbol) },
  });
  const { data: candles, isLoading: isLoadingCandles } = useGetCandles(safeSymbol, timeframe, {
    query: { enabled: !!safeSymbol, queryKey: getGetCandlesQueryKey(safeSymbol, timeframe) },
  });
  const { data: patterns } = useGetPatterns(safeSymbol, timeframe, {
    query: { enabled: !!safeSymbol, queryKey: getGetPatternsQueryKey(safeSymbol, timeframe) },
  });
  const { data: forecast } = useGetForecast(safeSymbol, timeframe, {
    query: { enabled: !!safeSymbol, queryKey: getGetForecastQueryKey(safeSymbol, timeframe) },
  });
  const { data: narrative } = useGetNarrative(safeSymbol, timeframe, {
    query: { enabled: !!safeSymbol, queryKey: getGetNarrativeQueryKey(safeSymbol, timeframe) },
  });
  const { data: setups } = useGetTradeSetups(safeSymbol, timeframe, {
    query: { enabled: !!safeSymbol, queryKey: getGetTradeSetupsQueryKey(safeSymbol, timeframe) },
  });
  const { data: zones } = useGetLiquidityZones(safeSymbol, timeframe, {
    query: { enabled: !!safeSymbol, queryKey: getGetLiquidityZonesQueryKey(safeSymbol, timeframe) },
  });

  const runAnalysis = useRunAnalysis();
  const generateNarrative = useGenerateNarrative();

  const handleRefreshAnalysis = () => {
    runAnalysis.mutate({ data: { timeframe }, symbol: safeSymbol }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPatternsQueryKey(safeSymbol, timeframe) });
        queryClient.invalidateQueries({ queryKey: getGetLiquidityZonesQueryKey(safeSymbol, timeframe) });
        queryClient.invalidateQueries({ queryKey: getGetTradeSetupsQueryKey(safeSymbol, timeframe) });
      },
    });
  };
  const handleRegenerateNarrative = () => {
    generateNarrative.mutate({ data: { timeframe }, symbol: safeSymbol }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetNarrativeQueryKey(safeSymbol, timeframe) }),
    });
  };

  if (!safeSymbol) return null;

  const live = prices.get(safeSymbol);
  const flash = flashes.get(safeSymbol);
  const livePrice = live?.price ?? instrument?.currentPrice ?? 0;
  const livePctChange = live?.changePct24h ?? instrument?.priceChangePct24h ?? 0;
  const isUp = livePctChange >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-5 pb-10">

      {/* ─── HUD Header ──────────────────────────────────── */}
      <div className="rounded-sm border border-border bg-card/40 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-5">
          {isLoadingInstrument ? (
            <div className="space-y-2"><Skeleton className="h-10 w-40" /><Skeleton className="h-5 w-24" /></div>
          ) : (
            <>
              <div>
                <div className="flex items-center gap-3 mb-0.5">
                  <h1 className="text-3xl font-black font-mono tracking-wider text-foreground">{instrument?.symbol}</h1>
                  {instrument && <SentimentBadge sentiment={instrument.marketSentiment} />}
                </div>
                <p className="text-xs text-muted-foreground">{instrument?.name}</p>
              </div>
              <div className="border-l border-border pl-5 pt-1">
                {/* Live price with flash */}
                <div
                  className="font-mono text-3xl font-bold tabular-nums transition-all duration-150"
                  style={{
                    color: flash === "up" ? "hsl(142,71%,55%)" : flash === "down" ? "hsl(0,84%,65%)" : "hsl(175,100%,50%)",
                    textShadow: flash === "up"
                      ? "0 0 20px hsla(142,71%,45%,0.8)"
                      : flash === "down"
                      ? "0 0 20px hsla(0,84%,60%,0.8)"
                      : "0 0 10px hsla(175,100%,50%,0.7), 0 0 30px hsla(175,100%,50%,0.3)",
                  }}
                >
                  {flash === "up" && <span className="text-sm mr-1">▲</span>}
                  {flash === "down" && <span className="text-sm mr-1">▼</span>}
                  ${livePrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center gap-1 text-sm font-mono mt-0.5 ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                  {isUp ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isUp ? "+" : ""}{livePctChange.toFixed(2)}% 24H
                  {live && (
                    <span className="ml-2 text-[9px] text-muted-foreground/50 font-mono flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-primary status-pulse" />
                      LIVE
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-1 bg-muted/40 p-1 rounded-sm">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-sm tracking-widest transition-all ${
                  timeframe === tf
                    ? "bg-primary/20 text-primary border border-primary/30 glow-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>
          <Button
            variant="outline" size="sm" onClick={handleRefreshAnalysis} disabled={runAnalysis.isPending}
            className="font-mono text-[10px] tracking-widest border-primary/30 text-primary hover:bg-primary/10"
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${runAnalysis.isPending ? "animate-spin" : ""}`} />
            ANALYZE
          </Button>
        </div>
      </div>

      {/* ─── Chart + sidebar ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: chart + narrative */}
        <div className="lg:col-span-2 space-y-5">

          {/* Candlestick chart */}
          <div className="rounded-sm border border-border bg-card/40 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary status-pulse" />
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Price Action · {timeframe.toUpperCase()} · Liquidity Overlay
                </span>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{candles?.length ?? 0} candles</span>
            </div>
            <div className="p-2">
              {isLoadingCandles ? (
                <div className="h-[380px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <span className="text-[10px] font-mono text-muted-foreground tracking-widest animate-pulse">LOADING MARKET DATA...</span>
                  </div>
                </div>
              ) : candles && candles.length > 0 ? (
                <CandlestickChart candles={candles} zones={zones ?? []} height={380} />
              ) : (
                <div className="h-[380px] flex items-center justify-center text-muted-foreground text-sm">No data available.</div>
              )}
            </div>
            {zones && zones.length > 0 && (
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {["support", "resistance", "order_block", "fair_value_gap", "liquidity_pool"]
                  .filter((t) => zones.some((z) => z.zoneType === t))
                  .map((t) => (
                    <span key={t} className={`text-[9px] font-mono px-2 py-0.5 rounded-sm border ${ZONE_BG[t]} ${ZONE_COLOR[t]}`}>
                      {t.replace(/_/g, " ")}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Market narrative */}
          <div className="rounded-sm border border-border bg-card/40">
            <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Market Narrative</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleRegenerateNarrative} disabled={generateNarrative.isPending}
                className="text-[9px] font-mono text-muted-foreground hover:text-primary h-6 px-2 tracking-widest">
                <RefreshCw className={`w-2.5 h-2.5 mr-1 ${generateNarrative.isPending ? "animate-spin" : ""}`} /> REGENERATE
              </Button>
            </div>
            <div className="p-4">
              {!narrative ? <div className="space-y-2"><Skeleton className="h-6 w-3/4" /><Skeleton className="h-20 w-full" /></div> : (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-foreground leading-snug">{narrative.headline}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{narrative.summary}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-emerald-500/8 border border-emerald-500/20 p-3 rounded-sm">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-400 font-bold text-[9px] uppercase tracking-widest">Bull Case</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{narrative.bullishCase}</p>
                    </div>
                    <div className="bg-red-500/8 border border-red-500/20 p-3 rounded-sm">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingDown className="h-3 w-3 text-red-400" />
                        <span className="text-red-400 font-bold text-[9px] uppercase tracking-widest">Bear Case</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{narrative.bearishCase}</p>
                    </div>
                  </div>
                  {narrative.riskFactors && narrative.riskFactors.length > 0 && (
                    <div className="pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3 w-3 text-orange-400" />
                        <span className="text-[9px] font-bold tracking-widest text-orange-400 uppercase">Risk Factors</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {narrative.riskFactors.map((r: string, i: number) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded-sm bg-orange-500/10 border border-orange-500/20 text-orange-300">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Forecast */}
          <div className="rounded-sm border border-border bg-card/40">
            <div className="px-4 py-2.5 border-b border-border/60">
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Forecast · {timeframe.toUpperCase()}</span>
            </div>
            <div className="p-4">
              {!forecast ? <Skeleton className="h-32" /> : (
                <div className="space-y-4">
                  {[
                    { label: "Bullish", value: forecast.bullishProbability, color: "#10b981", target: forecast.bullishTarget },
                    { label: "Bearish", value: forecast.bearishProbability, color: "#ef4444", target: forecast.bearishTarget },
                  ].map(({ label, value, color, target }) => (
                    <div key={label}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-mono font-bold tracking-widest" style={{ color }}>{label.toUpperCase()}</span>
                        <div className="text-right">
                          <span className="font-mono text-sm font-bold" style={{ color }}>{Math.round(value * 100)}%</span>
                          <span className="text-[9px] font-mono text-muted-foreground ml-2">
                            ${target?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border/50">
                    <div className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest mb-2">Key Drivers</div>
                    <ul className="space-y-1.5">
                      {forecast.keyDrivers.map((d: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-[10px] text-muted-foreground">
                          <ArrowRight className="h-2.5 w-2.5 text-primary mt-0.5 shrink-0" />{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active setups + Position Calculator */}
          <div className="rounded-sm border border-border bg-card/40">
            <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Active Setups</span>
              <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">{setups?.length ?? 0}</span>
            </div>
            <div className="p-3 space-y-3">
              {!setups ? <Skeleton className="h-28" /> :
               setups.length === 0 ? (
                <div className="py-6 text-center text-[10px] font-mono text-muted-foreground/50 tracking-widest">NO ACTIVE SETUPS</div>
              ) : setups.map((setup, i) => (
                <motion.div key={setup.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  className={`p-3 rounded-sm border ${setup.direction === "long" ? "border-emerald-500/25 bg-emerald-500/5" : "border-red-500/25 bg-red-500/5"}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-foreground">{setup.setupType}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm ${setup.direction === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                      {setup.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono mb-2">
                    <div><div className="text-muted-foreground/60">ENTRY</div><div>${setup.entryPrice.toLocaleString()}</div></div>
                    <div><div className="text-muted-foreground/60">STOP</div><div className="text-red-400">${setup.stopLoss.toLocaleString()}</div></div>
                    {setup.takeProfits?.slice(0, 2).map((tp: number, j: number) => (
                      <div key={j}><div className="text-muted-foreground/60">TP{j + 1}</div><div className="text-emerald-400">${tp.toLocaleString()}</div></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-mono text-muted-foreground">R:R 1:{setup.riskReward.toFixed(2)}</span>
                    <ConfidenceBar confidence={setup.confidence} />
                  </div>
                  {/* Position calculator embedded per setup */}
                  <PositionCalculator
                    entryPrice={setup.entryPrice}
                    stopLoss={setup.stopLoss}
                    takeProfits={setup.takeProfits ?? []}
                    direction={setup.direction as "long" | "short"}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Patterns */}
          <div className="rounded-sm border border-border bg-card/40">
            <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-primary" />
              <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Patterns</span>
              <span className="ml-auto text-[9px] font-mono text-muted-foreground/50">{patterns?.length ?? 0}</span>
            </div>
            <div className="p-3 space-y-1.5">
              {!patterns ? <Skeleton className="h-20" /> :
               patterns.length === 0 ? (
                <div className="py-4 text-center text-[10px] font-mono text-muted-foreground/50 tracking-widest">NO PATTERNS DETECTED</div>
              ) : patterns.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-sm bg-muted/20 border border-border/30 hover:border-primary/20 transition-colors">
                  <div>
                    <div className="text-xs font-medium text-foreground">{p.patternType}</div>
                    <div className="text-[9px] font-mono text-muted-foreground mt-0.5">
                      <span className={p.direction === "bullish" ? "text-emerald-400" : "text-red-400"}>{p.direction.toUpperCase()}</span>
                      {" · "}{p.status}{" · "}
                      <span className="text-primary">${p.priceLevel.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="w-20 shrink-0"><ConfidenceBar confidence={p.confidence} /></div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
