// app/routes/test-search.jsx
import {json, useLoaderData} from '@remix-run/react';
import {useState} from 'react';

export async function loader({request}) {
  // Get the search query from the URL parameters
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  // Prepare URL-encoded parameters as required by the Search API
  const params = new URLSearchParams();
  params.append('api_key', '2q4z1o1Y1r7H9Z0R6w6X'); // Your correct API key
  params.append('query', query);
  // You can append additional parameters here if needed (e.g., pagination)

  // Make a server-side POST request to the Searchanise Search API
  const res = await fetch('https://searchserverapi.com/api/search/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    // If the request fails, log the error and throw an error response
    const errorText = await res.text();
    console.error('Server error:', errorText);
    throw new Response('Unexpected Server Error', {status: 500});
  }

  // Parse the response as JSON (the response structure should include your search results)
  const data = await res.json();

  // Return the results to the component; adjust if your API structure differs
  return json({results: data.results || []});
}

export default function TestSearch() {
  // Use loader data to get the search results
  const {results} = useLoaderData();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div>
      <h1>Test Search Page</h1>
      {/* A simple search form that sends the query via GET */}
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
              <img
                src={item.image}
                alt={item.title}
                style={{maxWidth: '200px'}}
              />
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
