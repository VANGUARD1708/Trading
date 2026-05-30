import { useEffect, useState } from "react";

interface SearchResult {
  symbol: string;
  providerSymbol: string;
  name: string;
  category: string;
}

export function AssetSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const base = (window as any).__API_BASE__ ?? "";

        const res = await fetch(
          `${base}/api/search?q=${encodeURIComponent(query)}`
        );

        if (!res.ok) return;

        const data = await res.json();

        setResults(data);
      } catch {
        setResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-xl">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search any asset..."
        className="w-full h-12 px-4 rounded-sm border border-primary/20 bg-card"
      />

      {results.length > 0 && (
        <div className="absolute top-full mt-2 w-full border border-border bg-card rounded-sm overflow-hidden z-50">
          {results.map((item) => (
            <div
              key={item.symbol}
              className="px-4 py-3 hover:bg-primary/5 cursor-pointer border-b border-border/20"
            >
              <div className="font-mono font-bold">
                {item.symbol}
              </div>

              <div className="text-xs text-muted-foreground">
                {item.name} · {item.category}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}