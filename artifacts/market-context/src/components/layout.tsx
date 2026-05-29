import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, List, Activity, Settings, Bot, FlaskConical, Globe, Wifi, ChevronRight } from "lucide-react";
import { TickerTape } from "@/components/ticker-tape";

const navItems = [
  { href: "/",           label: "Command Center", icon: LayoutDashboard },
  { href: "/watchlist",  label: "Watchlist",       icon: List },
  { href: "/analyst",    label: "AI Analyst",      icon: Bot },
  { href: "/simulator",  label: "Simulator",       icon: FlaskConical },
  { href: "/market-map", label: "3D Market Map",   icon: Globe },
];

function UtcClock() {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
      {time.toUTCString().slice(17, 25)} UTC
    </span>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground bg-grid">

      {/* Ticker tape — full width at top */}
      <TickerTape />

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Sidebar ─────────────────────────────────────── */}
        <div className="w-60 border-r border-border bg-card flex flex-col z-20 relative overflow-hidden scan-lines">
          {/* Sidebar vertical glow strip */}
          <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent pointer-events-none" />

          {/* Logo */}
          <div className="p-5 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-7 h-7">
                <Activity className="h-5 w-5 text-primary glow-primary relative z-10" />
                <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: "3s" }} />
              </div>
              <span
                className="font-black tracking-[0.2em] text-sm text-primary glow-text-primary glitch-text flicker"
                data-text="NEXUSFLOW"
              >
                NEXUSFLOW
              </span>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
              <span className="text-[9px] font-mono text-emerald-400 tracking-wider">NEURAL LINK ACTIVE</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-150 relative overflow-hidden ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/3"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-full glow-primary" />
                  )}
                  <item.icon className={`h-4 w-4 flex-shrink-0 transition-all ${isActive ? "glow-primary" : ""}`} />
                  <span className="font-medium text-sm flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                </Link>
              );
            })}
          </nav>

          {/* System readout */}
          <div className="p-3 border-t border-border/60 space-y-2">
            <div className="flex items-center justify-between text-[9px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1">
                <Wifi className="h-2.5 w-2.5 text-emerald-400" /> FEED ONLINE
              </span>
              <UtcClock />
            </div>
            <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50">
              <span>v2.4.0-alpha</span>
              <span>NEXUSFLOW OS</span>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 w-full rounded-sm text-muted-foreground hover:text-foreground hover:bg-white/3 transition-colors text-sm">
              <Settings className="h-4 w-4" />
              <span className="font-medium">Settings</span>
            </button>
          </div>
        </div>

        {/* ─── Main content ─────────────────────────────────── */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Ambient radial gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% 0%, hsla(175,100%,50%,0.04) 0%, transparent 55%), radial-gradient(ellipse at 100% 100%, hsla(270,60%,50%,0.03) 0%, transparent 40%)",
            }}
          />
          {/* HUD corner brackets */}
          <div className="absolute top-3 left-3 w-5 h-5 border-t border-l border-primary/40 pointer-events-none z-10" />
          <div className="absolute top-3 right-3 w-5 h-5 border-t border-r border-primary/40 pointer-events-none z-10" />
          <div className="absolute bottom-3 left-3 w-5 h-5 border-b border-l border-primary/40 pointer-events-none z-10" />
          <div className="absolute bottom-3 right-3 w-5 h-5 border-b border-r border-primary/40 pointer-events-none z-10" />

          <main className="flex-1 overflow-y-auto p-6 md:p-8 z-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
