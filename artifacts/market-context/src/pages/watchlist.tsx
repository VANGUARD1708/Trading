import { useListInstruments } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { SentimentBadge } from "@/components/sentiment-badge";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function Watchlist() {
  const { data: instruments, isLoading } = useListInstruments();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Watchlist</h1>
        <p className="text-muted-foreground">Monitored assets and current sentiment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-32 rounded-lg" />)
        ) : instruments?.map((instrument, index) => {
          const isPositive = instrument.priceChangePct24h >= 0;
          return (
            <motion.div
              key={instrument.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link href={`/instruments/${instrument.symbol}`}>
                <Card className="hover:border-primary/50 cursor-pointer transition-colors bg-card/50 backdrop-blur group">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{instrument.symbol}</h3>
                        <p className="text-sm text-muted-foreground">{instrument.name}</p>
                      </div>
                      <SentimentBadge sentiment={instrument.marketSentiment} />
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Price</div>
                        <div className="font-mono text-lg">${instrument.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</div>
                      </div>
                      <div className={`flex items-center gap-1 font-mono text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {Math.abs(instrument.priceChangePct24h).toFixed(2)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
