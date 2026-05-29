import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, Zap, TrendingUp, TrendingDown, X, ChevronRight, AlertTriangle, Clock } from "lucide-react";
import { Link } from "wouter";

interface Opportunity {
  rank: number;
  symbol: string;
  direction: "long" | "short";
  conviction: number;
  setupType: string;
  thesis: string;
  entryLow: number;
  entryHigh: number;
  target: number;
  stopLoss: number;
  riskReward: number;
  urgency: "high" | "medium" | "low";
  keyRisk: string;
}

interface ScanResult {
  marketRegime: string;
  regimeDescription: string;
  overallScore: number;
  scanDurationMs: number;
  opportunities: Opportunity[];
  avoidSymbols: string[];
  avoidReason: string;
  executiveSummary: string;
}

const URGENCY_COLOR = { high: "text-red-400 border-red-500/30 bg-red-500/8", medium: "text-yellow-400 border-yellow-500/30 bg-yellow-500/8", low: "text-muted-foreground border-border bg-muted/20" };
const REGIME_COLOR: Record<string, string> = {
  trending_bull: "text-emerald-400", trending_bear: "text-red-400",
  ranging: "text-yellow-400", volatile: "text-orange-400", risk_off: "text-red-400", mixed: "text-primary",
};

function fmt(n: number, dec = 2) {
  return n?.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec }) ?? "—";
}

function ScanAnimation() {
  return (
    <div className="py-8 flex flex-col items-center gap-4">
      <div className="relative w-48 h-48">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border border-primary/30 animate-ping"
            style={{ animationDelay: `${i * 0.4}s`, animationDuration: "1.8s" }}
          />
        ))}
        <div className="absolute inset-6 rounded-full border border-primary/60 flex items-center justify-center bg-card">
          <Scan className="h-8 w-8 text-primary" style={{ animation: "spin 2s linear infinite" }} />
        </div>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 bg-primary rounded-full animate-bounce"
            style={{
              top: `${50 + 42 * Math.sin((i / 6) * Math.PI * 2)}%`,
              left: `${50 + 42 * Math.cos((i / 6) * Math.PI * 2)}%`,
              animationDelay: `${i * 0.15}s`,
              animationDuration: "1.2s",
            }}
          />
        ))}
      </div>
      <div className="text-center space-y-1">
        <div className="text-sm font-mono font-bold text-primary glow-text-primary animate-pulse tracking-widest">
          SCANNING MARKETS...
        </div>
        <div className="text-[10px] font-mono text-muted-foreground">Analyzing patterns · Scoring setups · Ranking opportunities</div>
      </div>
      <div className="flex gap-1.5 font-mono text-[9px] text-muted-foreground/60">
        {["BTC/USD", "ETH/USD", "SOL/USD", "XAU/USD", "EUR/USD"].map((s, i) => (
          <span key={s} className="animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>{s}</span>
        ))}
      </div>
    </div>
  );
}

export function SmartScan() {
  const [open, setOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);

  async function runScan() {
    setOpen(true);
    setScanning(true);
    setResult(null);
    try {
      const base = (window as any).__API_BASE__ ?? "";
      const res = await fetch(`${base}/api/dashboard/smart-scan`, { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setScanning(false);
    }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={runScan}
        disabled={scanning}
        className="flex items-center gap-2 px-3 py-1.5 rounded-sm border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-mono font-bold tracking-widest disabled:opacity-60 breathe-glow"
      >
        <Scan className={`h-3.5 w-3.5 ${scanning ? "animate-spin" : ""}`} />
        {scanning ? "SCANNING..." : "RUN SMART SCAN™"}
      </button>

      {/* Results overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-sm border border-primary/40 bg-card shadow-2xl holo-border"
              style={{ boxShadow: "0 0 60px hsla(175,100%,50%,0.15)" }}
            >
              {/* Header */}
              <div className="sticky top-0 px-5 py-3 border-b border-border/60 bg-card flex items-center gap-3 z-10">
                <Scan className="h-4 w-4 text-primary" />
                <span className="font-bold tracking-widest text-[11px] text-primary uppercase">NexusFlow Smart Scan™</span>
                {result && (
                  <span className="text-[9px] font-mono text-muted-foreground/60 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" /> {result.scanDurationMs}ms
                  </span>
                )}
                <button onClick={() => setOpen(false)} className="ml-auto p-1 hover:bg-white/5 rounded-sm text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {scanning && <ScanAnimation />}

                {result && !scanning && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    {/* Regime + summary */}
                    <div className="flex items-start gap-4 p-3 rounded-sm bg-muted/20 border border-border/40">
                      <div>
                        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-0.5">Market Regime</div>
                        <div className={`font-mono font-bold text-sm ${REGIME_COLOR[result.marketRegime] ?? "text-primary"}`}>
                          {result.marketRegime.replace(/_/g, " ").toUpperCase()}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{result.regimeDescription}</div>
                      </div>
                      <div className="ml-auto text-right">
                        <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-widest mb-0.5">Opportunity Score</div>
                        <div className="font-mono font-bold text-2xl text-primary">{result.overallScore}</div>
                        <div className="text-[9px] text-muted-foreground">/100</div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{result.executiveSummary}</p>

                    {/* Opportunities */}
                    <div>
                      <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-3 flex items-center gap-2">
                        <Zap className="h-3 w-3 text-primary" /> Top Opportunities
                      </div>
                      <div className="space-y-3">
                        {result.opportunities?.map((opp) => (
                          <Link key={opp.rank} href={`/instruments/${opp.symbol}`}>
                            <motion.div
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: opp.rank * 0.08 }}
                              className="p-4 rounded-sm border border-border/60 hover:border-primary/30 cursor-pointer transition-all data-row"
                              onClick={() => setOpen(false)}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-6 h-6 rounded-sm border border-primary/30 bg-primary/10 flex items-center justify-center text-primary font-mono font-bold text-xs shrink-0">
                                  {opp.rank}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-bold text-foreground">{opp.symbol}</span>
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm ${opp.direction === "long" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                                      {opp.direction.toUpperCase()}
                                    </span>
                                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-sm border ${URGENCY_COLOR[opp.urgency]}`}>
                                      {opp.urgency.toUpperCase()}
                                    </span>
                                    <span className="ml-auto text-[9px] font-mono text-muted-foreground">{opp.setupType}</span>
                                  </div>
                                  <p className="text-xs text-muted-foreground leading-relaxed">{opp.thesis}</p>
                                </div>
                              </div>

                              {/* Price levels */}
                              <div className="grid grid-cols-4 gap-2 text-[10px] font-mono mb-2">
                                <div>
                                  <div className="text-muted-foreground/50 mb-0.5">ENTRY</div>
                                  <div>${fmt(opp.entryLow)} – ${fmt(opp.entryHigh)}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground/50 mb-0.5">TARGET</div>
                                  <div className="text-emerald-400">${fmt(opp.target)}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground/50 mb-0.5">STOP</div>
                                  <div className="text-red-400">${fmt(opp.stopLoss)}</div>
                                </div>
                                <div>
                                  <div className="text-muted-foreground/50 mb-0.5">R:R</div>
                                  <div className="text-primary">1:{opp.riskReward?.toFixed(2)}</div>
                                </div>
                              </div>

                              {/* Conviction bar */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-muted/50 rounded-full overflow-hidden">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${opp.conviction}%` }}
                                    transition={{ delay: 0.3 + opp.rank * 0.1, duration: 0.6 }}
                                    className="h-full rounded-full"
                                    style={{
                                      background: opp.conviction > 80 ? "hsl(142,71%,45%)" : opp.conviction > 65 ? "hsl(45,100%,55%)" : "hsl(0,84%,60%)",
                                    }}
                                  />
                                </div>
                                <span className="text-[9px] font-mono text-muted-foreground w-16">CONV {opp.conviction}%</span>
                                <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                              </div>

                              {/* Key risk */}
                              <div className="mt-2 flex items-start gap-1.5">
                                <AlertTriangle className="h-3 w-3 text-orange-400 mt-0.5 shrink-0" />
                                <span className="text-[9px] text-muted-foreground/60">{opp.keyRisk}</span>
                              </div>
                            </motion.div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Avoid list */}
                    {result.avoidSymbols?.length > 0 && (
                      <div className="p-3 rounded-sm border border-red-500/20 bg-red-500/5">
                        <div className="text-[9px] font-bold tracking-widest text-red-400 uppercase mb-1 flex items-center gap-1.5">
                          <X className="h-2.5 w-2.5" /> Avoid
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {result.avoidSymbols.map((s) => (
                            <span key={s} className="text-[10px] font-mono px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded-sm text-red-300">{s}</span>
                          ))}
                        </div>
                        <p className="text-[10px] text-muted-foreground">{result.avoidReason}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
