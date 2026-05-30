// api-server/src/services/market-data.service.ts

export interface MarketQuote {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  timestamp: number;
}

export interface MarketCandle {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketDataService {
  async getQuote(symbol: string): Promise<MarketQuote> {
    throw new Error("Provider not connected");
  }

  async getCandles(
    symbol: string,
    timeframe: string,
    limit = 200,
  ): Promise<MarketCandle[]> {
    throw new Error("Provider not connected");
  }
}

export const marketData = new MarketDataService();