import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Trash2, TrendingUp, TrendingDown, Plus, Check, Clock } from "lucide-react";
import { useAlerts } from "@/contexts/alert-context";
import { useLivePrices } from "@/hooks/use-live-prices";

interface AlertModalProps {
  symbol: string;
  currentPrice?: number;
  onClose: () => void;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

function timeAgo(iso: string) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

export function AlertModal({ symbol, currentPrice = 0, onClose }: AlertModalProps) {
  const { alerts, addAlert, removeAlert, clearTriggered } = useAlerts();
  const { prices } = useLivePrices(3000);

  const livePrice = prices.get(symbol)?.price ?? currentPrice;
  const symbolAlerts = alerts.filter(a => a.symbol === symbol);
  const activeAlerts = symbolAlerts.filter(a => !a.triggered);
  const triggeredAlerts = symbolAlerts.filter(a => a.triggered);

  const [targetPrice, setTargetPrice] = useState(livePrice.toFixed(livePrice < 1 ? 6 : 2));
  const [condition, setCondition] = useState<"above" | "below">("above");
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);

  function handleAdd() {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) return;
    addAlert({ symbol, targetPrice: price, condition, note: note || undefined });
    setAdded(true);
    setNote("");
    setTimeout(() => setAdded(false), 2000);
  }

  function quickSet(pct: number) {
    const p = livePrice * (1 + pct / 100);
    setTargetPrice(p.toFixed(livePrice < 1 ? 6 : 2));
    setCondition(pct > 0 ? "above" : "below");
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        className="w-full max-w-md rounded-sm border border-primary/30 bg-card overflow-hidden"
        style={{ boxShadow: "0 0 60px hsla(175,100%,50%,0.1), 0 24px 64px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-border flex items-center gap-3">
          <Bell className="h-4 w-4 text-primary" />
          <div>
            <div className="font-bold text-sm text-foreground tracking-widest">{symbol}</div>
            <div className="text-[9px] font-mono text-muted-foreground tracking-widest">PRICE ALERT MANAGER</div>
          </div>
          <div className="ml-auto text-right">
            <div className="font-mono font-bold text-primary">${fmt(livePrice)}</div>
            <div className="text-[9px] font-mono text-muted-foreground">LIVE PRICE</div>
          </div>
          <button onClick={onClose} className="ml-3 p-1 hover:bg-white/5 rounded-sm text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Create alert */}
          <div className="space-y-3">
            <div className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase flex items-center gap-1.5">
              <Plus className="h-2.5 w-2.5 text-primary" /> New Alert
            </div>

            {/* Condition toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setCondition("above")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border text-xs font-mono font-bold tracking-wider transition-all ${
                  condition === "above"
                    ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                    : "border-border text-muted-foreground hover:border-emerald-500/30"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5" /> PRICE RISES ABOVE
              </button>
              <button
                onClick={() => setCondition("below")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-sm border text-xs font-mono font-bold tracking-wider transition-all ${
                  condition === "below"
                    ? "border-red-500/50 bg-red-500/15 text-red-400"
                    : "border-border text-muted-foreground hover:border-red-500/30"
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" /> PRICE FALLS BELOW
              </button>
            </div>

            {/* Quick preset offsets */}
            <div>
              <div className="text-[9px] font-mono text-muted-foreground/50 mb-1.5">Quick targets from current</div>
              <div className="flex gap-1">
                {[-5, -2, -1, +1, +2, +5].map(pct => (
                  <button
                    key={pct}
                    onClick={() => quickSet(pct)}
                    className="flex-1 text-[9px] font-mono py-1 rounded-sm border border-border hover:border-primary/30 hover:text-primary text-muted-foreground transition-all"
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Price input */}
            <div className="flex gap-2">
              <div className="flex-1 flex items-center bg-muted/30 border border-border rounded-sm px-3 focus-within:border-primary/50 transition-colors">
                <span className="text-muted-foreground/60 text-sm mr-1.5">$</span>
                <input
                  type="number"
                  value={targetPrice}
                  onChange={e => setTargetPrice(e.target.value)}
                  placeholder="Target price"
                  className="bg-transparent text-sm font-mono w-full outline-none py-2 text-foreground"
                  step={livePrice < 1 ? 0.000001 : livePrice < 100 ? 0.01 : 1}
                />
              </div>
            </div>

            {/* Note */}
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Note (optional) — e.g. 'Breakout confirmation'"
              maxLength={80}
              className="w-full bg-muted/20 border border-border rounded-sm px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-primary/40 transition-colors"
            />

            <button
              onClick={handleAdd}
              disabled={!targetPrice || parseFloat(targetPrice) <= 0}
              className={`w-full py-2.5 rounded-sm font-mono font-bold text-xs tracking-widest transition-all ${
                added
                  ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                  : "bg-primary/15 border border-primary/30 text-primary hover:bg-primary/25 disabled:opacity-40"
              }`}
            >
              {added ? <span className="flex items-center justify-center gap-2"><Check className="h-3.5 w-3.5" /> ALERT SET</span> : "SET PRICE ALERT"}
            </button>
          </div>

          {/* Active alerts */}
          {activeAlerts.length > 0 && (
            <div>
              <div className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase mb-2 flex items-center gap-1.5">
                <Bell className="h-2.5 w-2.5 text-primary" /> Active ({activeAlerts.length})
              </div>
              <div className="space-y-1.5">
                {activeAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-3 p-2.5 rounded-sm border border-border/60 bg-muted/10">
                    <span className={`text-[10px] font-mono shrink-0 ${alert.condition === "above" ? "text-emerald-400" : "text-red-400"}`}>
                      {alert.condition === "above" ? "▲ ABOVE" : "▼ BELOW"}
                    </span>
                    <span className="font-mono text-sm font-bold text-foreground">${fmt(alert.targetPrice)}</span>
                    {alert.note && <span className="text-[9px] text-muted-foreground italic truncate flex-1">"{alert.note}"</span>}
                    <span className="text-[9px] font-mono text-muted-foreground/50 shrink-0 flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{timeAgo(alert.createdAt)}
                    </span>
                    <button onClick={() => removeAlert(alert.id)} className="shrink-0 p-1 hover:bg-red-500/10 text-muted-foreground/40 hover:text-red-400 rounded-sm transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Triggered alerts */}
          {triggeredAlerts.length > 0 && (
            <div>
              <div className="text-[9px] font-bold tracking-widest text-muted-foreground/60 uppercase mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Check className="h-2.5 w-2.5 text-emerald-400" /> Triggered ({triggeredAlerts.length})</span>
                <button onClick={clearTriggered} className="text-[9px] font-mono text-muted-foreground/40 hover:text-red-400 transition-colors">CLEAR ALL</button>
              </div>
              <div className="space-y-1.5">
                {triggeredAlerts.map(alert => (
                  <div key={alert.id} className="flex items-center gap-3 p-2.5 rounded-sm border border-border/30 bg-muted/5 opacity-60">
                    <Check className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span className="font-mono text-sm text-foreground/60">${fmt(alert.targetPrice)}</span>
                    <span className="text-[9px] font-mono text-muted-foreground shrink-0">
                      hit ${fmt(alert.triggeredPrice ?? 0)} · {timeAgo(alert.triggeredAt ?? "")}
                    </span>
                    <button onClick={() => removeAlert(alert.id)} className="ml-auto shrink-0 p-1 hover:bg-red-500/10 text-muted-foreground/30 hover:text-red-400 rounded-sm transition-colors">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {symbolAlerts.length === 0 && (
            <div className="py-4 text-center">
              <BellOff className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/50">No alerts set for {symbol}</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
