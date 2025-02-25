// app/routes/test-search.jsx
import {json, useLoaderData} from '@remix-run/react';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  // Prepare URL-encoded parameters
  const params = new URLSearchParams();
  params.append('api_key', '2q4z1o1Y1r7H9Z0R6w6X'); // your correct API key
  params.append('query', query);

  const res = await fetch('https://searchserverapi.com/api/search/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  // Check for non-OK responses
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Server error:', errorText);
    throw new Response('Unexpected Server Error', {status: 500});
  }

  // Parse the JSON response
  const data = await res.json();
  return json({results: data.results || []});
}

export default function TestSearch() {
  const {results} = useLoaderData();

  return (
    <div>
      <h1>Test Search Page</h1>
      <form method="get">
        <input type="text" name="q" placeholder="Enter search query" />
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
