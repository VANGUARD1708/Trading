import { useState } from "react";
import { motion } from "framer-motion";
import {
  useListInstruments,
  useRunSimulation,
  useListSimulations,
  getListSimulationsQueryKey,
} from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Loader2, Play, Activity, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";

const SCENARIOS = [
  { id: "breakout_bull", label: "Breakout Bull", desc: "Price breaks above key resistance with volume — bullish momentum scenario" },
  { id: "breakdown_bear", label: "Breakdown Bear", desc: "Structural breakdown below support — bearish continuation scenario" },
  { id: "range_bound", label: "Range Bound", desc: "Price consolidates within range — low volatility, mean-reversion" },
  { id: "fed_rate_hike", label: "Fed Rate Hike", desc: "Federal Reserve surprise rate hike — risk-off across markets" },
  { id: "market_crash", label: "Market Crash", desc: "Systemic risk event — rapid price discovery to downside" },
  { id: "institutional_accumulation", label: "Institutional Accumulation", desc: "Smart money accumulation phase — gradual bullish drift" },
];

export default function Simulator() {
  const [symbol, setSymbol] = useState("BTC/USD");
  const [scenario, setScenario] = useState("breakout_bull");
  const [timeframe, setTimeframe] = useState("1d");

  const { data: instruments } = useListInstruments();
  const { data: pastSims } = useListSimulations({
    query: { queryKey: getListSimulationsQueryKey() },
  });
  const runSim = useRunSimulation();
  const queryClient = useQueryClient();

  const handleRun = () => {
    runSim.mutate(
      {
        data: {
          symbol,
          scenarioType: scenario as "breakout_bull" | "breakdown_bear" | "range_bound" | "fed_rate_hike" | "market_crash" | "institutional_accumulation" | "custom",
          timeframe: timeframe as "1h" | "4h" | "1d",
          numPaths: 20,
          horizonCandles: 50,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListSimulationsQueryKey() });
        },
      },
    );
  };

  const simData = runSim.data;
  const isRunning = runSim.isPending;

  const chartData: Record<string, number | string>[] = [];
  if (simData?.paths) {
    for (let i = 0; i < 51; i++) {
      const point: Record<string, number | string> = { index: i };
      simData.paths.forEach((path, pathIdx) => {
        if (path.prices[i] !== undefined) {
          point[`path_${pathIdx}`] = path.prices[i];
        }
      });
      chartData.push(point);
    }
  }

  const selectedDesc = SCENARIOS.find((s) => s.id === scenario)?.desc;
  const summary = simData?.summary;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full space-y-4 overflow-y-auto"
    >
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between bg-card p-4 rounded-xl border border-border">
        <div className="flex gap-4 flex-wrap">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Instrument</label>
            <Select value={symbol} onValueChange={setSymbol}>
              <SelectTrigger className="w-[160px]" data-testid="select-symbol">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {instruments?.map((inst) => (
                  <SelectItem key={inst.symbol} value={inst.symbol}>{inst.symbol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Scenario</label>
            <Select value={scenario} onValueChange={setScenario}>
              <SelectTrigger className="w-[200px]" data-testid="select-scenario">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {SCENARIOS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Timeframe</label>
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[100px]" data-testid="select-timeframe">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1H</SelectItem>
                <SelectItem value="4h">4H</SelectItem>
                <SelectItem value="1d">1D</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleRun} disabled={isRunning} className="gap-2" data-testid="button-run-simulation">
          {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Run Simulation
        </Button>
      </div>

      {selectedDesc && (
        <div className="text-sm text-muted-foreground px-2 italic">{selectedDesc}</div>
      )}

      <div className="flex-1 flex flex-col gap-4">
        <Card className="flex-1 min-h-[380px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" /> Monte Carlo Paths
              {simData && (
                <span className="ml-auto text-xs text-muted-foreground font-normal">
                  {simData.paths?.length} paths · {symbol} · {SCENARIOS.find(s => s.id === scenario)?.label}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isRunning ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-sm">Simulating Monte Carlo paths...</p>
              </div>
            ) : simData ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="index" stroke="#555" tick={{ fontSize: 10 }} />
                  <YAxis domain={["auto", "auto"]} stroke="#555" tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v as number).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} width={80} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, ""]} contentStyle={{ background: "#0d1117", border: "1px solid #1e2a36", fontSize: 11 }} />
                  <ReferenceLine x={0} stroke="#00ffcc" strokeDasharray="4 4" label={{ value: "NOW", fill: "#00ffcc", fontSize: 10, position: "insideTopLeft" }} />
                  {simData.paths?.map((path, i) => {
                    const endPrice = path.prices[path.prices.length - 1];
                    const startPrice = path.prices[0];
                    const isBull = endPrice > startPrice * 1.01;
                    const isBear = endPrice < startPrice * 0.99;
                    const color = isBull ? "#10b981" : isBear ? "#ef4444" : "#eab308";
                    return (
                      <Line key={i} type="monotone" dataKey={`path_${i}`} stroke={color} strokeWidth={1} dot={false} strokeOpacity={0.35} isAnimationActive={false} />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Activity className="h-10 w-10 opacity-20" />
                <p className="text-sm">Select an instrument and scenario, then run the simulation.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">Bullish Probability</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <span className="text-2xl font-bold text-emerald-500">
                  {(summary.bullishProbability * 100).toFixed(1)}%
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">Bearish Probability</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <span className="text-2xl font-bold text-red-500">
                  {(summary.bearishProbability * 100).toFixed(1)}%
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">Expected Return</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <span className={`text-2xl font-bold ${summary.expectedReturn >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                  {summary.expectedReturn >= 0 ? "+" : ""}{summary.expectedReturn.toFixed(2)}%
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-1 pt-4 px-4">
                <CardTitle className="text-xs text-muted-foreground font-medium">95% Confidence Band</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <span className="text-sm font-bold text-primary">
                  ${summary.confidenceInterval95Low.toLocaleString(undefined, { maximumFractionDigits: 0 })} – ${summary.confidenceInterval95High.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        {pastSims && pastSims.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" /> Past Simulations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {pastSims.slice(0, 8).map((sim) => (
                  <button
                    key={sim.id}
                    data-testid={`past-sim-${sim.id}`}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all"
                  >
                    {sim.symbol} · {SCENARIOS.find(s => s.id === sim.scenarioType)?.label ?? sim.scenarioType} · {sim.timeframe}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
