import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard, Html, Stars } from "@react-three/drei";
import { useLocation } from "wouter";
import * as THREE from "three";
import { useListInstruments } from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import type { Instrument } from "@workspace/api-client-react";

const SENTIMENT_COLOR: Record<string, string> = {
  strongly_bullish: "#10b981",
  bullish: "#22c55e",
  neutral: "#eab308",
  bearish: "#f97316",
  strongly_bearish: "#ef4444",
};

function InstrumentNode({ instrument, index, total }: { instrument: Instrument; index: number; total: number }) {
  const [hovered, setHovered] = useState(false);
  const [, setLocation] = useLocation();

  const angle = (index / total) * Math.PI * 2;
  const radius = 6;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5 + index) * 0.4;
    }
  });

  const maxVol = 40_000_000_000;
  const volNorm = Math.max(0.4, Math.min(1.6, (instrument.volume24h / maxVol) * 3 + 0.4));
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
        data-testid={`node-${instrument.symbol}`}
      >
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.2 : 0.5}
          roughness={0.2}
          metalness={0.8}
        />
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

export default function MarketMap() {
  const { data: instruments, isLoading } = useListInstruments();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full rounded-xl overflow-hidden relative border border-border bg-[#050a0e] min-h-[600px]"
    >
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
        <h1 className="text-sm font-bold tracking-[0.25em] text-primary uppercase opacity-90">
          NexusFlow 3D Market Map
        </h1>
      </div>

      <div className="absolute top-4 right-4 z-10 bg-card/80 backdrop-blur p-3 rounded-lg border border-border text-xs space-y-1.5 pointer-events-none">
        <div className="font-medium text-foreground mb-2">Sentiment</div>
        {Object.entries(SENTIMENT_COLOR).map(([key, clr]) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: clr, boxShadow: `0 0 6px ${clr}` }} />
            <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center z-10 text-xs text-muted-foreground pointer-events-none">
        Click a node to analyze · Scroll to zoom · Drag to rotate
      </div>

      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
        </div>
      ) : (
        <Canvas camera={{ position: [0, 4, 14], fov: 55 }}>
          <color attach="background" args={["#050a0e"]} />
          <ambientLight intensity={0.15} />
          <directionalLight position={[10, 10, 5]} intensity={0.3} />

          <gridHelper args={[30, 30, "#00ffcc22", "#00ffcc11"]} position={[0, -3, 0]} />

          <Stars radius={120} depth={60} count={300} factor={3} saturation={0} fade speed={0.8} />

          {instruments?.map((inst, i) => (
            <InstrumentNode
              key={inst.symbol}
              instrument={inst}
              index={i}
              total={instruments.length}
            />
          ))}

          <OrbitControls
            autoRotate
            autoRotateSpeed={0.4}
            enableDamping
            dampingFactor={0.06}
            maxPolarAngle={Math.PI / 2 + 0.15}
            minDistance={5}
            maxDistance={25}
          />
        </Canvas>
      )}
    </motion.div>
  );
}
