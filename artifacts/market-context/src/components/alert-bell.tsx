import { useState } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useAlerts } from "@/contexts/alert-context";
import { AlertModal } from "./alert-modal";

interface AlertBellProps {
  symbol: string;
  currentPrice?: number;
  size?: "sm" | "md";
  className?: string;
}

export function AlertBell({ symbol, currentPrice = 0, size = "md", className = "" }: AlertBellProps) {
  const [open, setOpen] = useState(false);
  const { alerts } = useAlerts();
  const activeCount = alerts.filter(a => a.symbol === symbol && !a.triggered).length;

  const sizeClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const btnSize = size === "sm" ? "p-1" : "p-1.5";

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); e.preventDefault(); setOpen(true); }}
        title={activeCount > 0 ? `${activeCount} active alert${activeCount > 1 ? "s" : ""} — click to manage` : "Set price alert"}
        className={`relative rounded-sm transition-all ${btnSize} ${
          activeCount > 0
            ? "text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
            : "text-muted-foreground/40 hover:text-primary hover:bg-primary/10"
        } ${className}`}
      >
        <Bell className={sizeClass} style={activeCount > 0 ? { filter: "drop-shadow(0 0 4px hsl(45,100%,55%))" } : undefined} />
        {activeCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-yellow-400 text-black rounded-full text-[8px] font-black flex items-center justify-center leading-none">
            {activeCount > 9 ? "9+" : activeCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <AlertModal symbol={symbol} currentPrice={currentPrice} onClose={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
