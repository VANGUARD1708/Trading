import React from 'react';

const TradingViewChart = () => {
  React.useEffect(() => {
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/tv.js';

    script.onload = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          symbol: 'NASDAQ:AAPL', // Default symbol
          interval: 'D', // Daily interval
          container_id: 'tradingview_widget',
          theme: 'light',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          allow_symbol_change: true,
          hide_top_toolbar: false,
          save_image: false,
        });
      }
    };

    document.body.appendChild(script);
  }, []);

  return <div id="tradingview_widget" style={{ height: '500px', width: '100%' }}></div>;
};

export default TradingViewChart;