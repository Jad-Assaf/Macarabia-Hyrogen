import {json, useLoaderData} from '@remix-run/react';
import {useState} from 'react';

export async function loader({request}) {
  // Get the search query from the URL, defaulting to an empty string if not provided
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  // Prepare parameters for the API call
  const params = new URLSearchParams();
  params.append('api_key', '2q4z1o1Y1r7H9Z0R6w6X'); // your correct API key
  params.append('query', query);

  // Make the POST request to the Searchanise API (server-side, so CORS is not an issue)
  const res = await fetch('https://searchserverapi.com/api/search/json', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Error response:', errorText);
    throw new Error('Unexpected Server Error');
  }
  const data = await res.json();

  return json({results: data.results || []});
}

export default function TestSearch() {
  const {results} = useLoaderData();
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
      {results.length > 0 ? (
        <div>
          {results.map((item) => (
            <div key={item.id}>
              <h3>{item.title}</h3>
              {/* Render additional product details as needed */}
            </div>
          ))}
        </div>
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
}
