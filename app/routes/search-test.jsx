import {json} from '@shopify/remix-oxygen'; // <-- Worker-friendly instead of @remix-run/node
import {useLoaderData} from '@remix-run/react';
import React, {useState} from 'react';

// 1) Server logic: runs in the worker environment
export async function loader() {
  // If you need to fetch data here, you can do so.
  // Just ensure you don't import or use Node-specific modules (like fs).
}

// 2) Client + SSR logic: React component that runs in the browser & hydrates on the server
export default function SearchTest() {
  // Use the data from the loader
  const {initialMessage} = useLoaderData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Fetch from your Vercel-based search API
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
