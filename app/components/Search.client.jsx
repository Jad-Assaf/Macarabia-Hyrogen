'use client'; // <--- Must be the first line

import React, {useState} from 'react';

export function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(
        `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(
          query,
        )}`,
      );
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      const data = await response.json();
      setResults(data.results || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <h1>Search Products</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={query}
          placeholder="Search..."
          onChange={(e) => setQuery(e.target.value)}
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
              <hr />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
