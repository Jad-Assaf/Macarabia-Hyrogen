// components/SearchaniseWidget.client.jsx
import { useEffect } from 'react';

export default function SearchaniseWidget() {
  useEffect(() => {
    // Set up the global configuration for Searchanise.
    window.Searchanise = {
      ApiKey: '5c3N7y6v5T', // Replace with your API key (e.g., "9c9A3t3j7A")
      SearchInput: '#search_input', // Selector for your search field
      options: {
        ResultsDiv: '#snize_results', // Container where search results will appear
        PriceFormat: {
          rate: 1.0,
          symbol: '$',
          decimals: 2,
          decimals_separator: '.',
          thousands_separator: ',',
          after: false,
        },
      },
    };

    // Dynamically load the Searchanise widget script.
    const script = document.createElement('script');
    script.src = 'https://searchserverapi.com/widgets/v1.0/init.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      {/* Your search input field */}
      <input type="text" id="search_input" placeholder="Search products..." />
      {/* The container where search results will be rendered */}
      <div id="snize_results"></div>
    </div>
  );
}
