export function ConfidenceBar({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);
  
  let colorClass = "bg-primary";
  if (confidence > 0.8) colorClass = "bg-emerald-500 glow-primary";
  else if (confidence < 0.4) colorClass = "bg-orange-500";
  else if (confidence < 0.2) colorClass = "bg-red-500";

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
        <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
      <span className="text-xs font-mono text-muted-foreground min-w-[3ch] text-right">{percentage}%</span>
    </div>
  );
}
