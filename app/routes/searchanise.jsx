// In your route file, e.g., app/routes/search.jsx
import { json, useLoaderData } from '@remix-run/react';

export async function loader({ request }) {
  const formData = new URLSearchParams(await request.text());
  const query = formData.get('query') || 'default query';

  const params = new URLSearchParams();
  params.append('api_key', '2q4z1o1Y1r7H9Z0R6w6X');
  params.append('query', query);

  const res = await fetch('https://searchserverapi.com/api/search/json', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  const data = await res.json();

  return json({ results: data.results || [] });
}

export default function SearchPage() {
  const { results } = useLoaderData();

  return (
    <div>
      <h1>Search Results</h1>
      {results.length ? (
        results.map(item => (
          <div key={item.id}>
            <h3>{item.title}</h3>
            {/* Render other product details */}
          </div>
        ))
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
}
