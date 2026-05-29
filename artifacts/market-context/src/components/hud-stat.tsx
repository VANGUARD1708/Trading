import { useEffect, useState } from "react";

interface HudStatProps {
  label: string;
  value: string | number;
  subtitle?: string;
  pct?: number;
  color?: "cyan" | "emerald" | "red" | "orange";
  size?: number;
}

const COLOR_MAP = {
  cyan:    { stroke: "hsla(175,100%,50%,0.9)", bg: "hsla(175,100%,50%,0.1)", text: "hsl(175,100%,50%)" },
  emerald: { stroke: "hsla(142,71%,45%,0.9)",  bg: "hsla(142,71%,45%,0.1)",  text: "hsl(142,71%,45%)" },
  red:     { stroke: "hsla(0,84%,60%,0.9)",    bg: "hsla(0,84%,60%,0.1)",    text: "hsl(0,84%,60%)" },
  orange:  { stroke: "hsla(25,95%,58%,0.9)",   bg: "hsla(25,95%,58%,0.1)",   text: "hsl(25,95%,58%)" },
};

function polarToCartesian(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, start);
  const e = polarToCartesian(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

export function HudStat({ label, value, subtitle, pct = 0, color = "cyan", size = 100 }: HudStatProps) {
  const [animPct, setAnimPct] = useState(0);
  const c = COLOR_MAP[color];
  const cx = size / 2, cy = size / 2, r = size * 0.38;
  const startAngle = -135, totalSweep = 270;
  const fillAngle = startAngle + totalSweep * Math.min(1, Math.max(0, animPct));

  useEffect(() => {
    const t = setTimeout(() => setAnimPct(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          <path
            d={arcPath(cx, cy, r, startAngle, startAngle + totalSweep)}
            fill="none"
            stroke="hsla(175,100%,50%,0.08)"
            strokeWidth={size * 0.06}
            strokeLinecap="round"
          />
          <path
            d={arcPath(cx, cy, r, startAngle, fillAngle)}
            fill="none"
            stroke={c.stroke}
            strokeWidth={size * 0.06}
            strokeLinecap="round"
            style={{ transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)", filter: `drop-shadow(0 0 4px ${c.text})` }}
          />
          <circle cx={cx} cy={cy} r={r * 0.55} fill={c.bg} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono font-bold leading-none" style={{ color: c.text, fontSize: size * 0.18 }}>
            {value}
          </span>
          {subtitle && (
            <span className="font-mono mt-0.5" style={{ color: c.text, fontSize: size * 0.1, opacity: 0.7 }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
      <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase text-center leading-tight">
        {label}
      </span>
    </div>
  );
}
