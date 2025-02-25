// app/routes/test-search.jsx
import { json, useLoaderData } from '@remix-run/react';
import { useState } from 'react';

export async function loader({ request }) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  // If no query is provided, return an empty result set.
  if (!query) {
    return json({ results: [] });
  }

  // Prepare URL-encoded parameters as required by the Search API
  const params = new URLSearchParams();
  params.append('api_key', '2q4z1o1Y1r7H9Z0R6w6X'); // your correct API key
  params.append('query', query);

  // Use HTTP (not HTTPS) per the documentation
  const res = await fetch('http://searchserverapi.com/api/search/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('API error:', errorText);
    throw new Response(errorText || 'Unexpected Server Error', { status: res.status });
  }

  const data = await res.json();
  return json({ results: data.results || [] });
}

export default function TestSearch() {
  const { results } = useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');

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
      <div>
        {results.length > 0 ? (
          results.map((item) => (
            <div key={item.id}>
              <h3>{item.title}</h3>
              <img src={item.image} alt={item.title} style={{ maxWidth: '200px' }} />
              {/* Render additional product details as needed */}
            </div>
          ))
        ) : (
          <p>No results found.</p>
        )}
      </div>
    </div>
  );
}
