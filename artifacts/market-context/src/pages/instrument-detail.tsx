import { useState } from "react";
import { useParams } from "wouter";
import { 
  useGetInstrument, 
  useGetCandles, 
  useGetPatterns, 
  useGetForecast,
  useGetNarrative,
  useGetTradeSetups,
  useGetLiquidityZones,
  useRunAnalysis,
  useGenerateNarrative,
  getGetInstrumentQueryKey,
  getGetCandlesQueryKey,
  getGetPatternsQueryKey,
  getGetForecastQueryKey,
  getGetNarrativeQueryKey,
  getGetTradeSetupsQueryKey,
  getGetLiquidityZonesQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import { SentimentBadge } from "@/components/sentiment-badge";
import { ConfidenceBar } from "@/components/confidence-bar";

export default function InstrumentDetail() {
  const { symbol } = useParams();
  const [timeframe, setTimeframe] = useState<"1m"|"5m"|"15m"|"1h"|"4h"|"1d">("1h");
  const queryClient = useQueryClient();

  const safeSymbol = symbol || "";

  const { data: instrument, isLoading: isLoadingInstrument } = useGetInstrument(safeSymbol, { query: { enabled: !!safeSymbol, queryKey: getGetInstrumentQueryKey(safeSymbol) }});
  const { data: candles, isLoading: isLoadingCandles } = useGetCandles(safeSymbol, timeframe, { query: { enabled: !!safeSymbol, queryKey: getGetCandlesQueryKey(safeSymbol, timeframe) }});
  const { data: patterns } = useGetPatterns(safeSymbol, timeframe, { query: { enabled: !!safeSymbol, queryKey: getGetPatternsQueryKey(safeSymbol, timeframe) }});
  const { data: forecast } = useGetForecast(safeSymbol, timeframe, { query: { enabled: !!safeSymbol, queryKey: getGetForecastQueryKey(safeSymbol, timeframe) }});
  const { data: narrative } = useGetNarrative(safeSymbol, timeframe, { query: { enabled: !!safeSymbol, queryKey: getGetNarrativeQueryKey(safeSymbol, timeframe) }});
  const { data: setups } = useGetTradeSetups(safeSymbol, timeframe, { query: { enabled: !!safeSymbol, queryKey: getGetTradeSetupsQueryKey(safeSymbol, timeframe) }});
  const { data: zones } = useGetLiquidityZones(safeSymbol, timeframe, { query: { enabled: !!safeSymbol, queryKey: getGetLiquidityZonesQueryKey(safeSymbol, timeframe) }});

  const runAnalysis = useRunAnalysis();
  const generateNarrative = useGenerateNarrative();

  const handleRefreshAnalysis = () => {
    runAnalysis.mutate({ data: { timeframe }, symbol: safeSymbol }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPatternsQueryKey(safeSymbol, timeframe) });
        queryClient.invalidateQueries({ queryKey: getGetLiquidityZonesQueryKey(safeSymbol, timeframe) });
        queryClient.invalidateQueries({ queryKey: getGetTradeSetupsQueryKey(safeSymbol, timeframe) });
      }
    });
  };

  const handleRegenerateNarrative = () => {
    generateNarrative.mutate({ data: { timeframe }, symbol: safeSymbol }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetNarrativeQueryKey(safeSymbol, timeframe) });
      }
    });
  };

  if (!safeSymbol) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {isLoadingInstrument ? <Skeleton className="h-10 w-48 mb-2" /> : (
            <div className="flex items-center gap-4 mb-1">
              <h1 className="text-4xl font-bold tracking-tight">{instrument?.symbol}</h1>
              {instrument && <SentimentBadge sentiment={instrument.marketSentiment} />}
            </div>
          )}
          {isLoadingInstrument ? <Skeleton className="h-5 w-32" /> : (
            <p className="text-muted-foreground">{instrument?.name}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Select value={timeframe} onValueChange={(v: any) => setTimeframe(v)}>
            <SelectTrigger className="w-[120px] bg-card">
              <SelectValue placeholder="Timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 Minute</SelectItem>
              <SelectItem value="5m">5 Minutes</SelectItem>
              <SelectItem value="15m">15 Minutes</SelectItem>
              <SelectItem value="1h">1 Hour</SelectItem>
              <SelectItem value="4h">4 Hours</SelectItem>
              <SelectItem value="1d">1 Day</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" onClick={handleRefreshAnalysis} disabled={runAnalysis.isPending}>
            <RefreshCw className={`w-4 h-4 mr-2 ${runAnalysis.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border overflow-hidden">
            <CardHeader className="pb-2 border-b border-border/50">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center justify-between">
                <span>PRICE ACTION & LIQUIDITY</span>
                {instrument && <span className="font-mono text-foreground">${instrument.currentPrice.toLocaleString()}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
              {isLoadingCandles ? (
                <div className="h-full flex items-center justify-center"><Skeleton className="h-[90%] w-[95%]" /></div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={candles} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(175, 100%, 50%)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(175, 100%, 50%)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="timestamp" hide />
                    <YAxis domain={['auto', 'auto']} hide />
                    <RechartsTooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={() => ''}
                    />
                    <Area type="monotone" dataKey="close" stroke="hsl(175, 100%, 50%)" fillOpacity={1} fill="url(#colorClose)" />
                    {zones?.map((zone) => (
                      <ReferenceLine 
                        key={zone.id} 
                        y={zone.priceLevel} 
                        stroke={zone.zoneType === 'support' ? 'hsl(142, 71%, 45%)' : 'hsl(0, 84%, 60%)'} 
                        strokeOpacity={0.5}
                        strokeDasharray="3 3" 
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Narrative Story */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" /> Market Narrative
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={handleRegenerateNarrative} disabled={generateNarrative.isPending}>
                <RefreshCw className={`w-3 h-3 mr-2 ${generateNarrative.isPending ? 'animate-spin' : ''}`} />
                Regenerate
              </Button>
            </CardHeader>
            <CardContent>
              {!narrative ? <Skeleton className="h-32" /> : (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg">{narrative.headline}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{narrative.summary}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-md">
                      <h4 className="text-emerald-400 font-bold text-xs uppercase mb-2">Bullish Case</h4>
                      <p className="text-sm text-muted-foreground">{narrative.bullishCase}</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-md">
                      <h4 className="text-red-400 font-bold text-xs uppercase mb-2">Bearish Case</h4>
                      <p className="text-sm text-muted-foreground">{narrative.bearishCase}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Data Area */}
        <div className="space-y-6">
          
          {/* Probabilistic Forecast */}
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Forecast ({timeframe})</CardTitle>
            </CardHeader>
            <CardContent>
              {!forecast ? <Skeleton className="h-24" /> : (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-emerald-400">Bullish</span>
                      <span className="font-mono">{Math.round(forecast.bullishProbability * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${forecast.bullishProbability * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-red-400">Bearish</span>
                      <span className="font-mono">{Math.round(forecast.bearishProbability * 100)}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-red-500" style={{ width: `${forecast.bearishProbability * 100}%` }} />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border mt-2">
                    <div className="text-xs text-muted-foreground mb-2 uppercase">Key Drivers</div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {forecast.keyDrivers.map((driver, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {driver}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trade Setups */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Active Setups
            </h3>
            {!setups ? (
              <Skeleton className="h-32" />
            ) : setups.length === 0 ? (
              <div className="p-4 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">No active setups for this timeframe.</div>
            ) : setups.map((setup) => (
              <Card key={setup.id} className="bg-card/50 backdrop-blur border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-bold">{setup.setupType}</div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-sm ${setup.direction === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {setup.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 font-mono">
                    <div>
                      <div className="text-muted-foreground mb-0.5">ENTRY</div>
                      <div>${setup.entryPrice}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-0.5">STOP</div>
                      <div className="text-red-400">${setup.stopLoss}</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">R:R 1:{setup.riskReward}</span>
                    <ConfidenceBar confidence={setup.confidence} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Patterns */}
          <div className="space-y-3">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-primary" /> Detected Patterns
            </h3>
            {!patterns ? (
              <Skeleton className="h-24" />
            ) : patterns.length === 0 ? (
               <div className="p-4 bg-muted/50 rounded-md text-center text-sm text-muted-foreground">No patterns detected.</div>
            ) : patterns.map((pattern) => (
              <div key={pattern.id} className="p-3 bg-card/50 backdrop-blur rounded-md border border-border flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm">{pattern.patternType}</div>
                  <div className="text-xs text-muted-foreground">{pattern.status} • ${pattern.priceLevel}</div>
                </div>
                <div className="w-24">
                  <ConfidenceBar confidence={pattern.confidence} />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
