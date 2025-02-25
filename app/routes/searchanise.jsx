// app/routes/test-search.jsx
import {json, useLoaderData, useFetcher} from '@remix-run/react';
import {useState, useEffect} from 'react';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  // If no query is provided, return empty results.
  if (!query) {
    return json({results: []});
  }

  const apiKey = '5c3N7y6v5T';
  // Use the /getresults endpoint to get extended search info
  const searchUrl = `https://searchserverapi.com/getresults?apiKey=${apiKey}&q=${encodeURIComponent(
    query,
  )}&output=json`;
  const res = await fetch(searchUrl, {
    method: 'GET',
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('API error:', errorText);
    throw new Response(errorText || 'Unexpected Server Error', {
      status: res.status,
    });
  }

  const data = await res.json();
  // According to the docs, products are in the "items" array.
  return json({results: data.items || []});
}

export default function TestSearch() {
  const {results} = useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const suggestionsFetcher = useFetcher();

  // Fetch suggestions when searchTerm changes (with debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        suggestionsFetcher.load(
          `/api/suggestions?q=${encodeURIComponent(searchTerm)}`,
        );
      } else {
        setSuggestions([]);
      }
    }, 300); // adjust debounce delay as needed

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, suggestionsFetcher]);

  useEffect(() => {
    if (suggestionsFetcher.data && suggestionsFetcher.data.suggestions) {
      setSuggestions(suggestionsFetcher.data.suggestions);
    }
  }, [suggestionsFetcher.data]);

  return (
    <div>
      <h1>Test Search Page</h1>
      <form method="get">
        <input
          type="text"
          name="q"
          placeholder="Enter search query"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {suggestions.length > 0 && (
        <div>
          <h3>Suggestions:</h3>
          <ul>
            {suggestions.map((sugg, index) => (
              <li key={index}>{sugg}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        {results.length > 0 ? (
          results.map((item) => (
            <div key={item.product_id || item.id}>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <img
                src={item.image_link}
                alt={item.title}
                style={{maxWidth: '200px'}}
              />
              <p>Price: {item.price}</p>
            </div>
          ))
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
}
