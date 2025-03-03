// app/routes/search-test.jsx
import {json} from '@remix-run/node'; // server runtime
import {useLoaderData} from '@remix-run/react'; // client runtime
import React, {useState} from 'react';

// 1) Server logic: fetch data or do secure stuff in the loader
export async function loader() {
  // purely optional if you want SSR data:
  // const data = await fetch('https://example.com/api...');
  return json({initialMessage: 'Hello from server!'});
}

// 2) Client logic: React component that runs in the browser
export default function SearchTest() {
  const {initialMessage} = useLoaderData(); // get loader data if you want

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(
          query,
        )}`,
      );
      if (!response.ok) {
        throw new Error('Network error');
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>{initialMessage}</h1>
      <form onSubmit={handleSubmit}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
        />
        <button type="submit">Search</button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}
      {!loading && results.length > 0 && (
        <ul>
          {results.map((item) => (
            <li key={item.product_id}>
              <strong>{item.title}</strong>
              <br />
              Product Type: {item.product_type}
              <br />
              SKU: {item.sku}
              <br />
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                View Product
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
