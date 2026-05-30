// api-server/src/services/symbol-registry.service.ts

export interface AssetDefinition {
  symbol: string;
  providerSymbol: string;
  name: string;
  category: string;
}

export const SYMBOLS: AssetDefinition[] = [
  {
    symbol: "BTC/USD",
    providerSymbol: "BTCUSDT",
    name: "Bitcoin",
    category: "crypto",
  },
  {
    symbol: "ETH/USD",
    providerSymbol: "ETHUSDT",
    name: "Ethereum",
    category: "crypto",
  },
  {
    symbol: "SOL/USD",
    providerSymbol: "SOLUSDT",
    name: "Solana",
    category: "crypto",
  },
  {
    symbol: "XAU/USD",
    providerSymbol: "XAUUSD",
    name: "Gold",
    category: "commodity",
  },
  {
    symbol: "EUR/USD",
    providerSymbol: "EURUSD",
    name: "Euro Dollar",
    category: "forex",
  },
];