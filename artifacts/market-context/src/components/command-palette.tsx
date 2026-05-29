import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useListInstruments } from "@workspace/api-client-react";
import { useAlerts } from "@/contexts/alert-context";
import {
  Search, LayoutDashboard, List, Bot, BarChart2, Globe,
  TrendingUp, TrendingDown, Scan, Bell, ChevronRight, Zap, X,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();
  const { data: instruments } = useListInstruments();
  const { activeCount } = useAlerts();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(o => !o);
        setQuery("");
        setActiveIndex(0);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const pages: Command[] = [
      { id: "nav-dashboard", label: "Command Center", sublabel: "Dashboard overview", icon: <LayoutDashboard className="h-4 w-4" />, category: "Navigation", action: () => navigate("/"), keywords: "home dashboard" },
      { id: "nav-watchlist", label: "Asset Monitor", sublabel: "Live watchlist", icon: <List className="h-4 w-4" />, category: "Navigation", action: () => navigate("/watchlist"), keywords: "watchlist instruments" },
      { id: "nav-analyst", label: "AI Analyst", sublabel: "Chat with AI", icon: <Bot className="h-4 w-4" />, category: "Navigation", action: () => navigate("/analyst"), keywords: "ai analyst chat" },
      { id: "nav-simulator", label: "Simulator", sublabel: "Monte Carlo & scenarios", icon: <BarChart2 className="h-4 w-4" />, category: "Navigation", action: () => navigate("/simulator"), keywords: "simulator montecarlo" },
      { id: "nav-market-map", label: "3D Market Map", sublabel: "3D visualization", icon: <Globe className="h-4 w-4" />, category: "Navigation", action: () => navigate("/market-map"), keywords: "3d market map" },
    ];

    const instrumentCmds: Command[] = (instruments ?? []).map(inst => ({
      id: `inst-${inst.symbol}`,
      label: inst.symbol,
      sublabel: `${inst.name} · $${inst.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} · ${inst.priceChangePct24h > 0 ? "+" : ""}${inst.priceChangePct24h.toFixed(2)}%`,
      icon: inst.priceChangePct24h >= 0
        ? <TrendingUp className="h-4 w-4 text-emerald-400" />
        : <TrendingDown className="h-4 w-4 text-red-400" />,
      category: "Instruments",
      action: () => navigate(`/instruments/${inst.symbol}`),
      keywords: `${inst.symbol} ${inst.name} instrument`,
    }));

    const actions: Command[] = [
      {
        id: "action-scan", label: "Run Smart Scan™", sublabel: "AI opportunity scanner",
        icon: <Scan className="h-4 w-4 text-primary" />, category: "Actions",
        action: () => { navigate("/"); setTimeout(() => { (document.querySelector("[data-scan-trigger]") as HTMLElement)?.click(); }, 200); },
        keywords: "scan smart ai opportunities",
      },
      {
        id: "action-alerts",
        label: `Price Alerts`,
        sublabel: activeCount > 0 ? `${activeCount} active alerts watching` : "No active alerts",
        icon: <Bell className={`h-4 w-4 ${activeCount > 0 ? "text-yellow-400" : ""}`} />,
        category: "Actions",
        action: () => navigate("/watchlist"),
        keywords: "alerts price notifications",
      },
    ];

    return [...pages, ...instrumentCmds, ...actions];
  }, [instruments, navigate, activeCount]);

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.sublabel?.toLowerCase().includes(q) ||
      c.keywords?.includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Command[]>();
    for (const cmd of filtered) {
      const list = map.get(cmd.category) ?? [];
      list.push(cmd);
      map.set(cmd.category, list);
    }
    return map;
  }, [filtered]);

  const flatFiltered = filtered;

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex(i => Math.min(i + 1, flatFiltered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex(i => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && flatFiltered[activeIndex]) {
      flatFiltered[activeIndex].action();
      setOpen(false);
    }
  }

  let globalIndex = 0;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: -8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: -8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-xl rounded-sm border border-primary/30 bg-card overflow-hidden"
              style={{ boxShadow: "0 0 80px hsla(175,100%,50%,0.12), 0 32px 80px rgba(0,0,0,0.8)" }}
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="h-4 w-4 text-primary shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveIndex(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search instruments, pages, actions..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none font-mono"
                />
                <div className="flex items-center gap-1">
                  <kbd className="text-[9px] font-mono text-muted-foreground/50 bg-muted/40 px-1.5 py-0.5 rounded">ESC</kbd>
                </div>
                <button onClick={() => setOpen(false)} className="text-muted-foreground/40 hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {filtered.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Zap className="h-6 w-6 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground/50">No results for "{query}"</p>
                  </div>
                ) : (
                  Array.from(grouped.entries()).map(([category, cmds]) => (
                    <div key={category}>
                      <div className="px-4 py-1.5 text-[9px] font-bold tracking-[0.15em] text-muted-foreground/40 uppercase sticky top-0 bg-card/95 backdrop-blur-sm">
                        {category}
                      </div>
                      {cmds.map(cmd => {
                        const idx = globalIndex++;
                        const isActive = idx === activeIndex;
                        return (
                          <div
                            key={cmd.id}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onClick={() => { cmd.action(); setOpen(false); }}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all ${
                              isActive ? "bg-primary/10" : "hover:bg-white/3"
                            }`}
                          >
                            <div className={`w-8 h-8 flex items-center justify-center rounded-sm border shrink-0 transition-colors ${
                              isActive ? "border-primary/40 bg-primary/15 text-primary" : "border-border text-muted-foreground"
                            }`}>
                              {cmd.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className={`text-sm font-medium transition-colors ${isActive ? "text-foreground" : "text-foreground/80"}`}>
                                {cmd.label}
                              </div>
                              {cmd.sublabel && (
                                <div className="text-[10px] font-mono text-muted-foreground/60 truncate">{cmd.sublabel}</div>
                              )}
                            </div>
                            {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary/60 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 border-t border-border/50 flex items-center gap-4 text-[9px] font-mono text-muted-foreground/40">
                <span><kbd className="bg-muted/40 px-1 py-0.5 rounded">↑↓</kbd> navigate</span>
                <span><kbd className="bg-muted/40 px-1 py-0.5 rounded">↵</kbd> select</span>
                <span><kbd className="bg-muted/40 px-1 py-0.5 rounded">⌘K</kbd> toggle</span>
                <span className="ml-auto">NEXUSFLOW COMMAND LINE</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
