import {json} from '@shopify/remix-oxygen';
import {useLoaderData} from '@remix-run/react';
import React, {useState, useEffect} from 'react';

// Optional server loader if you need SSR data:
export async function loader() {
  return json({initialMessage: 'Search Page'});
}

export default function SearchTest() {
  const {initialMessage} = useLoaderData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0); // track current page
  const [limit, setLimit] = useState(20); // results per page
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0); // total matches in DB

  // We'll fetch when user presses "Search" or changes page
  // But only if query is not empty
  useEffect(() => {
    if (!query) {
      // Clear results if no query
      setResults([]);
      setTotal(0);
      return;
    }
    fetchResults(query, page, limit);
  }, [page, limit]);

  async function fetchResults(searchTerm, pageNum, limitNum) {
    setLoading(true);
    setError('');

    try {
      const url = new URL('https://search-app-vert.vercel.app/api/search');
      url.searchParams.set('q', searchTerm);
      url.searchParams.set('page', pageNum);
      url.searchParams.set('limit', limitNum);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Request failed, status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setPage(0); // reset to page 0 on new search
    fetchResults(query, 0, limit);
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
            setPage(0); // reset page if changing limit
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
    </div>
  );
}
