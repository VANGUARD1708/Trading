import { useState, useMemo } from "react";
import { Calculator, DollarSign, TrendingUp, Shield } from "lucide-react";

interface PositionCalculatorProps {
  entryPrice: number;
  stopLoss: number;
  takeProfits: number[];
  direction: "long" | "short";
}

function fmt(n: number, dec = 2) {
  return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

export function PositionCalculator({ entryPrice, stopLoss, takeProfits, direction }: PositionCalculatorProps) {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);

  const calc = useMemo(() => {
    const riskAmount = accountSize * (riskPct / 100);
    const stopDist = Math.abs(entryPrice - stopLoss);
    const stopDistPct = stopDist / entryPrice;
    if (stopDistPct === 0) return null;

    const positionValueUsd = riskAmount / stopDistPct;
    const positionUnits = positionValueUsd / entryPrice;

    const tpResults = takeProfits.slice(0, 3).map((tp) => {
      const tpDist = Math.abs(tp - entryPrice);
      const rrRatio = tpDist / stopDist;
      const profit = riskAmount * rrRatio;
      const pct = (tpDist / entryPrice) * 100;
      return { tp, profit, pct, rrRatio };
    });

    return { riskAmount, positionValueUsd, positionUnits, tpResults, stopDist, stopDistPct: stopDistPct * 100 };
  }, [accountSize, riskPct, entryPrice, stopLoss, takeProfits]);

  return (
    <div className="rounded-sm border border-primary/20 bg-primary/5 p-3 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Calculator className="h-3.5 w-3.5 text-primary" />
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Position Calculator</span>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider block mb-1">
            Account ($)
          </label>
          <div className="flex items-center bg-card border border-border rounded-sm px-2 py-1.5">
            <DollarSign className="h-3 w-3 text-muted-foreground/50 mr-1" />
            <input
              type="number"
              value={accountSize}
              onChange={(e) => setAccountSize(Math.max(100, Number(e.target.value)))}
              className="bg-transparent text-xs font-mono w-full outline-none text-foreground"
              min={100}
              step={1000}
            />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-wider block mb-1">
            Risk (%)
          </label>
          <div className="flex items-center bg-card border border-border rounded-sm px-2 py-1.5">
            <input
              type="number"
              value={riskPct}
              onChange={(e) => setRiskPct(Math.min(10, Math.max(0.1, Number(e.target.value))))}
              className="bg-transparent text-xs font-mono w-full outline-none text-foreground"
              min={0.1}
              max={10}
              step={0.5}
            />
            <span className="text-muted-foreground/50 text-xs">%</span>
          </div>
        </div>
      </div>

      {/* Risk presets */}
      <div className="flex gap-1">
        {[0.5, 1, 2, 3].map((p) => (
          <button
            key={p}
            onClick={() => setRiskPct(p)}
            className={`flex-1 text-[9px] font-mono py-0.5 rounded-sm border transition-all ${
              riskPct === p
                ? "border-primary/50 bg-primary/20 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {p}%
          </button>
        ))}
      </div>

      {calc && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/40">
            <div className="bg-red-500/8 border border-red-500/20 rounded-sm p-2">
              <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5 flex items-center gap-1">
                <Shield className="h-2.5 w-2.5 text-red-400" /> MAX RISK
              </div>
              <div className="text-red-400 font-mono font-bold text-sm">${fmt(calc.riskAmount)}</div>
              <div className="text-[9px] font-mono text-muted-foreground/50">Stop: {fmt(calc.stopDistPct, 2)}%</div>
            </div>
            <div className="bg-primary/8 border border-primary/20 rounded-sm p-2">
              <div className="text-[9px] font-mono text-muted-foreground/60 mb-0.5">POSITION SIZE</div>
              <div className="text-primary font-mono font-bold text-sm">${fmt(calc.positionValueUsd)}</div>
              <div className="text-[9px] font-mono text-muted-foreground/50">{calc.positionUnits.toFixed(4)} units</div>
            </div>
          </div>

          {/* TP levels */}
          {calc.tpResults.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] font-mono text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 text-emerald-400" /> Profit Targets
              </div>
              {calc.tpResults.map((tp, i) => (
                <div key={i} className="flex items-center justify-between text-[10px] font-mono bg-emerald-500/5 border border-emerald-500/15 rounded-sm px-2 py-1">
                  <span className="text-muted-foreground">TP{i + 1} ${fmt(tp.tp, 2)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground/50">R:{fmt(tp.rrRatio, 2)}</span>
                    <span className="text-emerald-400 font-bold">+${fmt(tp.profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
