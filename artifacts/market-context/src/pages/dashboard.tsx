import { useGetDashboardSummary, useGetTopSetups, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Activity, TrendingUp, TrendingDown, Target, Zap, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: topSetups, isLoading: isLoadingSetups } = useGetTopSetups();
  const { data: activities, isLoading: isLoadingActivity } = useGetRecentActivity();

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Command Center</h1>
        <p className="text-muted-foreground">System status online. Market overview updated.</p>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoadingSummary ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)
        ) : summary ? (
          <>
            <StatCard title="Total Instruments" value={summary.totalInstruments} icon={Activity} />
            <StatCard title="Active Setups" value={summary.activeSetupsCount} icon={Target} valueColor="text-primary glow-text-primary" />
            <StatCard title="Avg Confidence" value={`${Math.round(summary.avgConfidence * 100)}%`} icon={Zap} />
            <StatCard 
              title="Top Mover" 
              value={summary.topMover} 
              subtitle={`${summary.topMoverPct > 0 ? '+' : ''}${summary.topMoverPct}%`} 
              icon={summary.topMoverPct >= 0 ? TrendingUp : TrendingDown} 
              valueColor={summary.topMoverPct >= 0 ? "text-emerald-400" : "text-red-400"}
            />
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Setups */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> High-Conviction Setups
          </h2>
          {isLoadingSetups ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
          ) : topSetups?.map((setup, index) => (
            <motion.div
              key={setup.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/instruments/${setup.symbol}`}>
                <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50 backdrop-blur">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg">{setup.symbol}</span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-sm ${setup.direction === 'long' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {setup.direction.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">{setup.timeframe}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{setup.setupType}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground mb-1">R:R Ratio</div>
                      <div className="font-mono font-bold text-primary">1:{setup.riskReward}</div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" /> System Activity
          </h2>
          <Card className="bg-card/50 backdrop-blur overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
                {isLoadingActivity ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)
                ) : activities?.map((activity, index) => {
                  let Icon = Info;
                  let color = "text-blue-400";
                  if (activity.severity === 'alert') { Icon = AlertTriangle; color = "text-red-400"; }
                  if (activity.severity === 'warning') { Icon = AlertCircle; color = "text-orange-400"; }
                  if (activity.eventType === 'setup_triggered') { Icon = Target; color = "text-primary"; }

                  return (
                    <motion.div 
                      key={activity.id} 
                      className="flex gap-3 items-start border-b border-border/50 pb-4 last:border-0 last:pb-0"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={`mt-1 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm">{activity.symbol}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(activity.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{activity.title}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, valueColor = "text-foreground" }: any) {
  return (
    <Card className="bg-card/50 backdrop-blur">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <h3 className={`text-2xl font-bold font-mono ${valueColor}`}>{value}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}
