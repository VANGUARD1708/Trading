import { Badge } from "@/components/ui/badge";
import { InstrumentMarketSentiment, MarketNarrativeSentiment } from "@workspace/api-client-react";

type SentimentType = InstrumentMarketSentiment | MarketNarrativeSentiment;

export function SentimentBadge({ sentiment }: { sentiment: SentimentType }) {
  const config = {
    strongly_bullish: { label: "STRONGLY BULLISH", className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" },
    bullish: { label: "BULLISH", className: "bg-green-500/20 text-green-400 border-green-500/50" },
    neutral: { label: "NEUTRAL", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" },
    bearish: { label: "BEARISH", className: "bg-orange-500/20 text-orange-400 border-orange-500/50" },
    strongly_bearish: { label: "STRONGLY BEARISH", className: "bg-red-500/20 text-red-400 border-red-500/50" },
  };

  const { label, className } = config[sentiment] || config.neutral;

  return (
    <Badge variant="outline" className={`font-mono text-[10px] tracking-wider py-0.5 px-2 rounded-sm uppercase ${className}`}>
      {label}
    </Badge>
  );
}
