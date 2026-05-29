import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, TrendingUp, TrendingDown, X, Zap } from "lucide-react";
import { useAlerts } from "@/contexts/alert-context";

export function AlertNotifications() {
  const { notifications, dismissNotification } = useAlerts();

  useEffect(() => {
    if (notifications.length === 0) return;
    const latest = notifications[0];
    const timer = setTimeout(() => dismissNotification(latest.id), 9000);
    return () => clearTimeout(timer);
  }, [notifications, dismissNotification]);

  return (
    <div className="fixed top-4 right-4 z-[100] space-y-2 max-w-sm pointer-events-none">
      <AnimatePresence mode="popLayout">
        {notifications.slice(0, 4).map((notif) => {
          const { alert, triggeredPrice } = notif;
          const isAbove = alert.condition === "above";
          const color = isAbove ? "emerald" : "red";

          return (
            <motion.div
              key={notif.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.85 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="pointer-events-auto rounded-sm border overflow-hidden"
              style={{
                background: `hsla(${isAbove ? "142,30%,6%" : "0,30%,6%"},0.98)`,
                borderColor: isAbove ? "hsla(142,71%,45%,0.6)" : "hsla(0,84%,60%,0.6)",
                boxShadow: isAbove
                  ? "0 0 30px hsla(142,71%,45%,0.25), 0 4px 24px rgba(0,0,0,0.6)"
                  : "0 0 30px hsla(0,84%,60%,0.25), 0 4px 24px rgba(0,0,0,0.6)",
              }}
            >
              {/* Animated top bar */}
              <motion.div
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: 9, ease: "linear" }}
                style={{
                  transformOrigin: "left",
                  height: 2,
                  background: isAbove ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)",
                }}
              />

              <div className="px-4 py-3 flex items-start gap-3">
                <div
                  className="mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: isAbove ? "hsla(142,71%,45%,0.15)" : "hsla(0,84%,60%,0.15)",
                    border: isAbove ? "1px solid hsla(142,71%,45%,0.4)" : "1px solid hsla(0,84%,60%,0.4)",
                  }}
                >
                  {isAbove
                    ? <TrendingUp className="h-4 w-4 text-emerald-400" />
                    : <TrendingDown className="h-4 w-4 text-red-400" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Zap className="h-2.5 w-2.5 text-primary" />
                    <span className="text-[9px] font-mono font-bold tracking-widest text-primary uppercase">
                      Price Alert Triggered
                    </span>
                  </div>
                  <div className="font-mono font-bold text-base text-foreground">
                    {alert.symbol}
                    <span className={`ml-2 text-sm ${isAbove ? "text-emerald-400" : "text-red-400"}`}>
                      ${triggeredPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {isAbove ? "▲ Rose above" : "▼ Fell below"} target ${alert.targetPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  {alert.note && (
                    <div className="text-[10px] text-muted-foreground/60 italic mt-1 truncate">"{alert.note}"</div>
                  )}
                </div>

                <button
                  onClick={() => dismissNotification(notif.id)}
                  className="mt-0.5 shrink-0 p-1 rounded-sm hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
