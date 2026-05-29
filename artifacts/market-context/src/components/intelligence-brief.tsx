import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Brain, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function parseSection(text: string, key: string): string {
  const regex = new RegExp(`\\*\\*${key}\\*\\*:\\s*([\\s\\S]*?)(?=\\*\\*[A-Z]|$)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

function BriefSection({ title, content, color }: { title: string; content: string; color: string }) {
  if (!content) return null;
  return (
    <div className={`border-l-2 pl-3 py-0.5`} style={{ borderColor: color }}>
      <div className="text-[9px] font-bold tracking-widest uppercase mb-0.5" style={{ color }}>{title}</div>
      <p className="text-xs text-foreground/80 leading-relaxed">{content}</p>
    </div>
  );
}

export function IntelligenceBrief() {
  const [brief, setBrief] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [collapsed, setCollapsed] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchBrief = useCallback(() => {
    setBrief("");
    setIsStreaming(true);

    const base = (window as any).__API_BASE__ ?? "";
    const es = new EventSource(`${base}/api/dashboard/ai-brief`);

    es.onmessage = (event) => {
      if (event.data === "[DONE]") {
        es.close();
        setIsStreaming(false);
        setLastUpdated(new Date());
        return;
      }
      try {
        const { content, error } = JSON.parse(event.data);
        if (error) { es.close(); setIsStreaming(false); return; }
        if (content) setBrief((prev) => prev + content);
      } catch { /* ignore */ }
    };

    es.onerror = () => { es.close(); setIsStreaming(false); };
    return () => es.close();
  }, []);

  useEffect(() => {
    const cleanup = fetchBrief();
    const autoRefresh = setInterval(() => setRefreshKey((k) => k + 1), 120_000);
    return () => { cleanup?.(); clearInterval(autoRefresh); };
  }, [refreshKey, fetchBrief]);

  const regime = parseSection(brief, "MARKET REGIME");
  const overview = parseSection(brief, "OVERVIEW");
  const opportunity = parseSection(brief, "TOP OPPORTUNITY");
  const risks = parseSection(brief, "KEY RISKS");

  const regimeColor =
    regime.toLowerCase().includes("bull") ? "hsl(142,71%,45%)" :
    regime.toLowerCase().includes("bear") || regime.toLowerCase().includes("risk") ? "hsl(0,84%,60%)" :
    regime.toLowerCase().includes("vol") ? "hsl(25,95%,58%)" :
    "hsl(175,100%,50%)";

  return (
    <div className="rounded-sm border border-primary/25 bg-card/40 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2">
        <Brain className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          AI Intelligence Brief
        </span>
        {isStreaming && (
          <span className="flex items-center gap-1 text-[9px] font-mono text-primary animate-pulse">
            <Zap className="h-2.5 w-2.5" /> GENERATING
          </span>
        )}
        {regime && !isStreaming && (
          <span
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ml-1"
            style={{ color: regimeColor, borderColor: regimeColor + "40", background: regimeColor + "15" }}
          >
            {regime}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          {lastUpdated && (
            <span className="text-[9px] font-mono text-muted-foreground/40">
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={isStreaming}
            className="p-1 rounded-sm hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`h-3 w-3 ${isStreaming ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded-sm hover:bg-white/5 text-muted-foreground hover:text-primary transition-colors"
          >
            {collapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4">
              {isStreaming && !brief && (
                <div className="flex items-center gap-3 py-4">
                  <div className="flex gap-0.5">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-0.5 bg-primary rounded-full animate-pulse"
                        style={{ height: 8 + Math.random() * 16, animationDelay: `${i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground animate-pulse tracking-widest">
                    NEURAL ANALYSIS IN PROGRESS...
                  </span>
                </div>
              )}

              {brief && (
                <div className="space-y-3">
                  {(overview || (!overview && brief && !regime)) && (
                    <BriefSection
                      title="Overview"
                      content={overview || brief}
                      color="hsl(175,100%,50%)"
                    />
                  )}
                  {opportunity && (
                    <BriefSection title="Top Opportunity" content={opportunity} color="hsl(142,71%,45%)" />
                  )}
                  {risks && (
                    <BriefSection title="Key Risks" content={risks} color="hsl(0,84%,60%)" />
                  )}
                  {isStreaming && (
                    <span className="inline-block w-1 h-3 bg-primary/80 animate-pulse ml-0.5 align-middle" />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
