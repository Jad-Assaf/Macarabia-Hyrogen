import {json} from '@shopify/remix-oxygen'; // Use the worker-friendly import for your environment.
import {useLoaderData} from '@remix-run/react';
import React, {useState, useEffect} from 'react';

// Optional loader for initial server data.
export async function loader() {
  return json({initialMessage: 'Search Page'});
}

export default function SearchTest() {
  const {initialMessage} = useLoaderData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [suggestions, setSuggestions] = useState([]);

  async function fetchResults(searchQuery, pageNumber, limitNumber) {
    setLoading(true);
    setError('');
    try {
      const url = new URL('https://search-app-vert.vercel.app/api/search');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('page', pageNumber);
      url.searchParams.set('limit', limitNumber);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Request failed, status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
      setSuggestions(data.did_you_mean || []);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPage(0);
    await fetchResults(query, 0, limit);
  }

  function handleNextPage() {
    if ((page + 1) * limit < total) {
      setPage((prev) => prev + 1);
    }
  }

  function handlePrevPage() {
    if (page > 0) {
      setPage((prev) => prev - 1);
    }
  }

  useEffect(() => {
    if (query) {
      fetchResults(query, page, limit);
    } else {
      setResults([]);
      setTotal(0);
    }
  }, [page, limit]);

  return (
    <div style={{maxWidth: '600px', margin: '0 auto'}}>
      <h1>{initialMessage}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Search</button>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
          }}
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}

      {!loading && results.length > 0 && (
        <>
          <p>
            Showing {results.length} results on page {page + 1} of{' '}
            {Math.ceil(total / limit)} (total {total})
          </p>
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
          <button onClick={handlePrevPage} disabled={page <= 0}>
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={(page + 1) * limit >= total}
          >
            Next
          </button>
        </>
      )}

      {!loading && results.length === 0 && query && suggestions.length > 0 && (
        <div>
          <p>No results for "{query}". Did you mean:</p>
          {suggestions.map((sugObj, i) => (
            <div key={i}>
              <p>
                For token: <strong>{sugObj.original}</strong>
              </p>
              <ul>
                {sugObj.suggestions.map((suggest, j) => (
                  <li key={j}>
                    <button
                      onClick={() => {
                        // Replace the token in the query with the suggestion.
                        const correctedQuery = query.replace(
                          sugObj.original,
                          suggest,
                        );
                        setQuery(correctedQuery);
                        setPage(0);
                        fetchResults(correctedQuery, 0, limit);
                      }}
                    >
                      {suggest}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
