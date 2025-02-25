// app/routes/test-search.jsx
import {json, useLoaderData} from '@remix-run/react';
import {useState, useEffect} from 'react';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  // If no query is provided, return empty results.
  if (!query) {
    return json({results: []});
  }

  const apiKey = '5c3N7y6v5T';
  // Use the /getresults endpoint to get extended search info (without suggestions)
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

  // Client-side: fetch suggestions as user types
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        // Construct the suggestions URL with suggestions=true
        const apiKey = '5c3N7y6v5T';
        const suggestionsUrl = `https://searchserverapi.com/getresults?apiKey=${apiKey}&q=${encodeURIComponent(
          searchTerm,
        )}&output=json&suggestions=true`;

        fetch(suggestionsUrl, {method: 'GET'})
          .then((res) => {
            if (!res.ok) {
              return res.text().then((text) => {
                throw new Error(text);
              });
            }
            return res.json();
          })
          .then((data) => {
            setSuggestions(data.suggestions || []);
          })
          .catch((error) => {
            console.error('Suggestions fetch error:', error);
            setSuggestions([]);
          });
      } else {
        setSuggestions([]);
      }
    }, 300); // Debounce delay of 300ms

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

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
