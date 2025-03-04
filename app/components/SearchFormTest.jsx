import React, {useState, useEffect, useCallback} from 'react';
import {debounce} from 'lodash'; // Make sure to install lodash: npm install lodash

const SearchBar = ({onSuggestionSelect}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);

  // Debounced search function
  const debouncedFetchSuggestions = useCallback(
    debounce(async (q) => {
      if (!q) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(q)}`,
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setSuggestions(data.results || []);
      } catch (err) {
        setError(err.message);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedFetchSuggestions(query);

    // Cleanup to cancel any pending debounced calls when the component unmounts or query changes
    return () => debouncedFetchSuggestions.cancel();
  }, [query, debouncedFetchSuggestions]);

  return (
    <div className="search-bar">
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
      {suggestions.length > 0 && (
        <ul className="suggestions-dropdown">
          {suggestions.map((item) => (
            <li
              key={item.id}
              onClick={() => {
                onSuggestionSelect(item);
                setQuery(item.title); // Optionally set input value on select
                setSuggestions([]);
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
