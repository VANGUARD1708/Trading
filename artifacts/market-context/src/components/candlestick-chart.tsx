import { useState, useRef } from "react";

interface Candle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface Zone {
  id: number;
  priceLevel: number;
  zoneType: string;
  strength: number;
}

interface CandlestickChartProps {
  candles: Candle[];
  zones?: Zone[];
  height?: number;
}

const ZONE_COLORS: Record<string, string> = {
  support:         "hsla(142,71%,45%,0.7)",
  resistance:      "hsla(0,84%,60%,0.7)",
  order_block:     "hsla(45,100%,60%,0.7)",
  fair_value_gap:  "hsla(200,100%,60%,0.7)",
  liquidity_pool:  "hsla(175,100%,50%,0.7)",
};

export function CandlestickChart({ candles, zones = [], height = 380 }: CandlestickChartProps) {
  const [tooltip, setTooltip] = useState<{ candle: Candle; x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!candles || candles.length === 0) return null;

  const PADDING = { top: 16, right: 64, bottom: 48, left: 8 };
  const VOL_HEIGHT = 48;
  const chartH = height - PADDING.top - PADDING.bottom - VOL_HEIGHT - 8;

  const prices = candles.flatMap((c) => [c.high, c.low]);
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  const pRange = maxP - minP || 1;

  const volumes = candles.map((c) => c.volume);
  const maxVol = Math.max(...volumes) || 1;

  const toY = (p: number) => PADDING.top + ((maxP - p) / pRange) * chartH;
  const volY = (v: number) => (v / maxVol) * VOL_HEIGHT;

  const candleCount = candles.length;
  const displayCount = Math.min(candleCount, 80);
  const startIdx = Math.max(0, candleCount - displayCount);
  const visible = candles.slice(startIdx);

  const priceLabels: number[] = [];
  const steps = 5;
  for (let i = 0; i <= steps; i++) {
    priceLabels.push(minP + (pRange * i) / steps);
  }

  return (
    <div className="relative w-full select-none" style={{ height }}>
      <svg
        ref={svgRef}
        className="w-full h-full"
        viewBox={`0 0 800 ${height}`}
        preserveAspectRatio="none"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Background grid lines */}
        {priceLabels.map((p) => (
          <line
            key={p}
            x1={PADDING.left}
            x2={800 - PADDING.right}
            y1={toY(p)}
            y2={toY(p)}
            stroke="hsla(175,100%,50%,0.06)"
            strokeWidth={1}
          />
        ))}

        {/* Liquidity zone lines */}
        {zones.map((z) => {
          const y = toY(z.priceLevel);
          if (y < PADDING.top || y > PADDING.top + chartH) return null;
          const col = ZONE_COLORS[z.zoneType] ?? "hsla(175,100%,50%,0.5)";
          return (
            <g key={z.id}>
              <line
                x1={PADDING.left}
                x2={800 - PADDING.right}
                y1={y}
                y2={y}
                stroke={col}
                strokeWidth={1}
                strokeDasharray="4 3"
              />
              <text
                x={800 - PADDING.right + 4}
                y={y + 3}
                fill={col}
                fontSize={8}
                fontFamily="monospace"
              >
                {z.zoneType.replace(/_/g, " ").toUpperCase().slice(0, 3)}
              </text>
            </g>
          );
        })}

        {/* Candles */}
        {visible.map((c, i) => {
          const totalW = 800 - PADDING.left - PADDING.right;
          const slotW = totalW / visible.length;
          const cx = PADDING.left + i * slotW + slotW / 2;
          const bodyW = Math.max(1, slotW * 0.55);

          const up = c.close >= c.open;
          const col = up ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)";
          const bodyTop = toY(Math.max(c.open, c.close));
          const bodyBot = toY(Math.min(c.open, c.close));
          const bodyH = Math.max(1, bodyBot - bodyTop);
          const wickTop = toY(c.high);
          const wickBot = toY(c.low);

          const volH = volY(c.volume);
          const volTop = PADDING.top + chartH + 10 + VOL_HEIGHT - volH;

          return (
            <g
              key={i}
              onMouseEnter={(e) => {
                const rect = svgRef.current?.getBoundingClientRect();
                if (rect) {
                  setTooltip({ candle: c, x: e.clientX - rect.left, y: e.clientY - rect.top });
                }
              }}
            >
              {/* Wick */}
              <line x1={cx} y1={wickTop} x2={cx} y2={wickBot} stroke={col} strokeWidth={1} opacity={0.8} />
              {/* Body */}
              <rect
                x={cx - bodyW / 2}
                y={bodyTop}
                width={bodyW}
                height={bodyH}
                fill={up ? col : col}
                stroke={col}
                strokeWidth={0.5}
                opacity={0.85}
              />
              {/* Volume bar */}
              <rect
                x={cx - bodyW / 2}
                y={volTop}
                width={bodyW}
                height={volH}
                fill={col}
                opacity={0.25}
              />
            </g>
          );
        })}

        {/* Y-axis price labels */}
        {priceLabels.map((p) => (
          <text
            key={p}
            x={800 - PADDING.right + 4}
            y={toY(p) + 3}
            fill="hsla(215,20%,50%,0.8)"
            fontSize={8}
            fontFamily="monospace"
          >
            {p >= 1000
              ? p.toLocaleString(undefined, { maximumFractionDigits: 0 })
              : p.toFixed(4)}
          </text>
        ))}

        {/* X-axis time labels */}
        {visible
          .filter((_, i) => i % Math.ceil(visible.length / 6) === 0)
          .map((c, i) => {
            const totalW = 800 - PADDING.left - PADDING.right;
            const slotW = totalW / visible.length;
            const idx = visible.indexOf(c);
            const cx = PADDING.left + idx * slotW + slotW / 2;
            const label = new Date(c.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
            return (
              <text
                key={i}
                x={cx}
                y={height - 4}
                fill="hsla(215,20%,50%,0.6)"
                fontSize={8}
                fontFamily="monospace"
                textAnchor="middle"
              >
                {label}
              </text>
            );
          })}

        {/* Volume label */}
        <text
          x={PADDING.left + 2}
          y={PADDING.top + chartH + 16}
          fill="hsla(215,20%,40%,0.7)"
          fontSize={7}
          fontFamily="monospace"
          letterSpacing={1}
        >
          VOL
        </text>
      </svg>

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur border border-border rounded-lg p-3 text-xs font-mono space-y-0.5 shadow-xl min-w-[150px]"
          style={{ left: Math.min(tooltip.x + 12, 620), top: Math.max(8, tooltip.y - 60) }}
        >
          <div className="text-muted-foreground text-[9px] mb-1">
            {new Date(tooltip.candle.timestamp).toLocaleString()}
          </div>
          {(["open", "high", "low", "close"] as const).map((k) => (
            <div key={k} className="flex justify-between gap-4">
              <span className="text-muted-foreground uppercase">{k}</span>
              <span className={k === "close" ? (tooltip.candle.close >= tooltip.candle.open ? "text-emerald-400" : "text-red-400") : "text-foreground"}>
                ${tooltip.candle[k].toLocaleString(undefined, { maximumFractionDigits: 4 })}
              </span>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-border pt-1 mt-1">
            <span className="text-muted-foreground">VOL</span>
            <span className="text-primary">{tooltip.candle.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      )}
    </div>
  );
}
