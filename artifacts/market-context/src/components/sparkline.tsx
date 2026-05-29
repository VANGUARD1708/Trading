interface SparklineProps {
  symbol: string;
  currentPrice: number;
  changePct: number;
  width?: number;
  height?: number;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = ((s * 1664525 + 1013904223) & 0xffffffff) >>> 0;
    return s / 4294967295;
  };
}

function generatePoints(symbol: string, currentPrice: number, changePct: number, count = 24): number[] {
  const seed = symbol.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 7), 13);
  const rand = lcg(seed);

  // Work backwards from currentPrice
  const startPrice = currentPrice / (1 + changePct / 100);
  const points: number[] = [];

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const baseline = startPrice + (currentPrice - startPrice) * t;
    const noise = (rand() - 0.48) * currentPrice * 0.018;
    points.push(Math.max(currentPrice * 0.01, baseline + noise));
  }

  return points;
}

export function Sparkline({ symbol, currentPrice, changePct, width = 80, height = 28 }: SparklineProps) {
  const points = generatePoints(symbol, currentPrice, changePct);
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const isUp = changePct >= 0;

  const pad = 2;
  const coords = points.map((p, i) => {
    const x = pad + (i / (points.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (p - min) / range) * (height - pad * 2);
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");

  // Build area fill path
  const first = coords[0].split(",");
  const last = coords[coords.length - 1].split(",");
  const fillPath = `M${first[0]},${height} L${polyline.replace(/\s/g, " L")} L${last[0]},${height} Z`;

  const color = isUp ? "hsl(142,71%,45%)" : "hsl(0,84%,60%)";
  const fillId = `spark-fill-${symbol.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${fillId})`} />
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 2px ${color}80)` }}
      />
      {/* Last point dot */}
      <circle
        cx={coords[coords.length - 1].split(",")[0]}
        cy={coords[coords.length - 1].split(",")[1]}
        r="2"
        fill={color}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }}
      />
    </svg>
  );
}
