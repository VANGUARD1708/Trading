import { useState, useRef, useEffect, Component, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useListInstruments } from "@workspace/api-client-react";
import { Loader2, Globe, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Instrument } from "@workspace/api-client-react";

// ─── WebGL support detection ───────────────────────────────────────────────
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

// ─── Error boundary for Three.js Canvas ────────────────────────────────────
class CanvasErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { errored: boolean }
> {
  state = { errored: false };
  static getDerivedStateFromError() {
    return { errored: true };
  }
  render() {
    return this.state.errored ? this.props.fallback : this.props.children;
  }
}

// ─── Sentiment helpers ──────────────────────────────────────────────────────
const SENTIMENT_COLOR: Record<string, string> = {
  strongly_bullish: "#10b981",
  bullish:          "#22c55e",
  neutral:          "#eab308",
  bearish:          "#f97316",
  strongly_bearish: "#ef4444",
};

function SentimentIcon({ s }: { s: string }) {
  if (s === "strongly_bullish" || s === "bullish")
    return <TrendingUp className="h-3 w-3" />;
  if (s === "strongly_bearish" || s === "bearish")
    return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

// ─── 2-D fallback map ───────────────────────────────────────────────────────
function MarketMap2D({ instruments }: { instruments: Instrument[] }) {
  const [, setLocation] = useLocation();

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#050a0e] flex flex-col">
      {/* grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#00ffcc" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* title */}
      <div className="relative z-10 px-6 pt-5 pb-2 pointer-events-none">
        <h1 className="text-xs font-bold tracking-[0.25em] text-primary uppercase">NexusFlow Market Map</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">Node size = 24h volume · Color = sentiment · Click to analyze</p>
      </div>

      {/* nodes */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-3xl aspect-[2/1]">
          {instruments.map((inst, i) => {
            const total = instruments.length;
            const angle = (i / total) * Math.PI * 2 - Math.PI / 2;
            const rx = 42, ry = 38; // % of container
            const cx = 50 + rx * Math.cos(angle);
            const cy = 50 + ry * Math.sin(angle);
            const maxVol = Math.max(...instruments.map(x => x.volume24h));
            const size = 48 + (inst.volume24h / maxVol) * 52; // 48–100 px
            const color = SENTIMENT_COLOR[inst.marketSentiment] ?? "#eab308";
            const isUp = inst.priceChangePct24h >= 0;

            return (
              <motion.button
                key={inst.symbol}
                className="absolute flex flex-col items-center gap-1 group"
                style={{ left: `${cx}%`, top: `${cy}%`, transform: "translate(-50%,-50%)" }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ scale: 1.15 }}
                onClick={() => setLocation(`/instruments/${encodeURIComponent(inst.symbol)}`)}
              >
                {/* glow ring */}
                <div
                  className="rounded-full flex items-center justify-center font-bold text-white transition-shadow duration-300 group-hover:shadow-[0_0_24px_var(--glow)]"
                  style={{
                    width: size,
                    height: size,
                    background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}55)`,
                    border: `2px solid ${color}`,
                    boxShadow: `0 0 12px ${color}66`,
                    // @ts-ignore
                    "--glow": color,
                    fontSize: size > 70 ? 13 : 11,
                  }}
                >
                  {inst.symbol.split("/")[0]}
                </div>
                {/* label below */}
                <div className="text-center leading-tight">
                  <div className="text-[10px] font-semibold" style={{ color }}>{inst.symbol}</div>
                  <div className={`text-[9px] flex items-center gap-0.5 justify-center ${isUp ? "text-emerald-400" : "text-red-400"}`}>
                    <SentimentIcon s={inst.marketSentiment} />
                    {isUp ? "+" : ""}{inst.priceChangePct24h.toFixed(2)}%
                  </div>
                </div>
              </motion.button>
            );
          })}

          {/* connecting lines between nodes */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {instruments.map((inst, i) => {
              const total = instruments.length;
              const a1 = (i / total) * Math.PI * 2 - Math.PI / 2;
              const a2 = ((i + 1) % total / total) * Math.PI * 2 - Math.PI / 2;
              const rx = 42, ry = 38;
              const x1 = 50 + rx * Math.cos(a1);
              const y1 = 50 + ry * Math.sin(a1);
              const x2 = 50 + rx * Math.cos(a2);
              const y2 = 50 + ry * Math.sin(a2);
              return (
                <line
                  key={inst.symbol}
                  x1={`${x1}%`} y1={`${y1}%`}
                  x2={`${x2}%`} y2={`${y2}%`}
                  stroke="#00ffcc"
                  strokeWidth="0.5"
                  opacity="0.2"
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* legend */}
      <div className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur p-3 rounded-lg border border-border text-xs space-y-1.5 pointer-events-none">
        <div className="font-medium text-foreground mb-2">Sentiment</div>
        {Object.entries(SENTIMENT_COLOR).map(([key, clr]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clr, boxShadow: `0 0 5px ${clr}` }} />
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 3-D Canvas (lazy-loaded to avoid crashing on no-GPU envs) ─────────────
function MarketMap3D({ instruments }: { instruments: Instrument[] }) {
  const [, setLocation] = useLocation();
  // Dynamic imports so the module is never evaluated server-side or in no-GPU envs
  const [Deps, setDeps] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import("@react-three/fiber"),
      import("@react-three/drei"),
      import("three"),
    ]).then(([fiber, drei, THREE]) => {
      setDeps({ fiber, drei, THREE });
    }).catch(() => setDeps(null));
  }, []);

  if (!Deps) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  const { Canvas, useFrame } = Deps.fiber;
  const { OrbitControls, Text, Billboard, Html, Stars } = Deps.drei;
  const THREE = Deps.THREE;

  function InstrumentNode({ instrument, index, total }: { instrument: Instrument; index: number; total: number }) {
    const [hovered, setHovered] = useState(false);
    const angle = (index / total) * Math.PI * 2;
    const radius = 6;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const meshRef = useRef<any>(null);

    useFrame((state: any) => {
      if (meshRef.current) {
        meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.4;
      }
    });

    const maxVol = Math.max(...instruments.map(x => x.volume24h));
    const volNorm = Math.max(0.4, Math.min(1.6, (instrument.volume24h / maxVol) * 2 + 0.4));
    const scale = hovered ? volNorm * 1.35 : volNorm;
    const color = SENTIMENT_COLOR[instrument.marketSentiment] ?? "#eab308";

    return (
      <group position={[x, 0, z]}>
        <mesh
          ref={meshRef}
          scale={scale}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
          onClick={() => setLocation(`/instruments/${encodeURIComponent(instrument.symbol)}`)}
        >
          <sphereGeometry args={[1, 32, 32]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.2 : 0.5} roughness={0.2} metalness={0.8} />
        </mesh>
        <pointLight color={color} intensity={hovered ? 3 : 1.2} distance={6} />
        <Billboard position={[0, -1.8, 0]}>
          <Text fontSize={0.35} color="#00ffcc" anchorX="center" anchorY="middle">
            {instrument.symbol}
          </Text>
        </Billboard>
        {hovered && (
          <Html position={[0, 1.8, 0]} center>
            <div className="bg-card/95 backdrop-blur border border-primary/30 p-3 rounded-lg shadow-xl text-xs min-w-[160px] pointer-events-none space-y-1">
              <div className="font-bold text-primary text-sm">{instrument.symbol}</div>
              <div className="text-muted-foreground">{instrument.name}</div>
              <div className="flex justify-between border-t border-border pt-1 mt-1">
                <span className="text-muted-foreground">Price</span>
                <span className="font-mono">${instrument.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">24h</span>
                <span className={instrument.priceChangePct24h >= 0 ? "text-emerald-400" : "text-red-400"}>
                  {instrument.priceChangePct24h >= 0 ? "+" : ""}{instrument.priceChangePct24h.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sentiment</span>
                <span style={{ color }} className="capitalize">{instrument.marketSentiment.replace(/_/g, " ")}</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    );
  }

  return (
    <Canvas camera={{ position: [0, 4, 14], fov: 55 }}>
      <color attach="background" args={["#050a0e"]} />
      <ambientLight intensity={0.15} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      <gridHelper args={[30, 30, "#00ffcc22", "#00ffcc11"]} position={[0, -3, 0]} />
      <Stars radius={120} depth={60} count={300} factor={3} saturation={0} fade speed={0.8} />
      {instruments.map((inst, i) => (
        <InstrumentNode key={inst.symbol} instrument={inst} index={i} total={instruments.length} />
      ))}
      <OrbitControls autoRotate autoRotateSpeed={0.4} enableDamping dampingFactor={0.06} maxPolarAngle={Math.PI / 2 + 0.15} minDistance={5} maxDistance={25} />
    </Canvas>
  );
}

// ─── Main export ────────────────────────────────────────────────────────────
export default function MarketMap() {
  const { data: instruments, isLoading } = useListInstruments();
  const [webgl] = useState(() => hasWebGL());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full rounded-xl overflow-hidden relative border border-border bg-[#050a0e] min-h-[600px] flex flex-col"
    >
      {!webgl && (
        <div className="absolute top-12 left-4 z-20 flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-[10px] px-2 py-1 rounded-full pointer-events-none">
          <Globe className="h-3 w-3" /> 2D mode — WebGL unavailable in this environment
        </div>
      )}

      <div className="absolute bottom-4 left-0 right-0 text-center z-10 text-xs text-muted-foreground pointer-events-none">
        {webgl
          ? "Click a node to analyze · Scroll to zoom · Drag to rotate"
          : "Click a node to open its instrument detail page"}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : webgl ? (
        <CanvasErrorBoundary fallback={<MarketMap2D instruments={instruments ?? []} />}>
          <div className="flex-1">
            <MarketMap3D instruments={instruments ?? []} />
          </div>
        </CanvasErrorBoundary>
      ) : (
        <MarketMap2D instruments={instruments ?? []} />
      )}
    </motion.div>
  );
}
