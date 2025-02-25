// app/routes/test-search.jsx
import {json, useLoaderData} from '@remix-run/react';
import {useState} from 'react';

export async function loader({request}) {
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || '';

  // If no query is provided, return empty results.
  if (!query) {
    return json({results: []});
  }

  const apiKey = '2q4z1o1Y1r7H9Z0R6w6X';
  // Use the /getresults endpoint to get extended search info (as per documentation)
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

  // According to the docs, extended information is returned.
  // We assume that the products are in the "items" array.
  return json({results: data.items || []});
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
