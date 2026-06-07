import axios from 'axios';

const ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with your actual API Key
const BASE_URL = 'https://www.alphavantage.co/query';

/**
 * Fetch real-time stock market data from Alpha Vantage API.
 * @param symbol Stock ticker symbol (e.g., 'AAPL' for Apple).
 * @param interval Time interval for data (e.g., '1min', '5min').
 */
export const fetchStockData = async (symbol: string, interval: string = '1min') => {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_INTRADAY',
        symbol,
        interval,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    if (response.data['Time Series (1min)']) {
      return response.data['Time Series (1min)'];
    } else if (response.data.Note) {
      throw new Error('API limit reached. Please try later.');
    } else {
      throw new Error('Invalid API response. Check stock ticker or API key.');
    }
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw error;
  }
};

/**
 * Example usage:
 * fetchStockData('AAPL').then(data => console.log(data));
 */