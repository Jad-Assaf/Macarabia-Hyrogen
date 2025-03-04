// SearchBar.jsx
import React, {useState, useEffect, useCallback} from 'react';
import {debounce} from 'lodash'; // Ensure lodash is installed: npm install lodash

const SearchBar = ({onResultSelect}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  // Debounced function to fetch results from the search endpoint
  const debouncedFetchResults = useCallback(
    debounce(async (q) => {
      if (!q) {
        setResults([]);
        return;
      }
      try {
        const response = await fetch(
          `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(
            q,
          )}`,
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setResults(data.results || []);
      } catch (err) {
        setError(err.message);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedFetchResults(query);
    return () => debouncedFetchResults.cancel();
  }, [query, debouncedFetchResults]);

  return (
    <div className="instant-search-bar">
      <input
        type="text"
        placeholder="Type to search..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setError(null);
        }}
      />
      {error && <p className="error">{error}</p>}
      {results.length > 0 && (
        <ul className="results-dropdown">
          {results.map((item) => (
            <li
              key={item.product_id}
              onClick={() => {
                onResultSelect(item);
                setQuery(item.title); // Optionally update input with the selected result title
                setResults([]);
              }}
            >
              {item.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
