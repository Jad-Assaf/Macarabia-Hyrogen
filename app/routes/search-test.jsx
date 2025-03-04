import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link, useNavigate, useLocation} from '@remix-run/react';
import React, {useState, useEffect} from 'react';
import {Money} from '@shopify/hydrogen';
import '../styles/SearchPage.css';

// Optional server loader for initial data.
export async function loader() {
  return json({initialMessage: 'Search Page'});
}

export default function SearchTest() {
  const {initialMessage} = useLoaderData();
  const location = useLocation();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local cache object where each key is like "q=samsung&page=0&limit=20"
  // This lives in React state, but is also synced to localStorage so it persists.
  const [cache, setCache] = useState({});

  // Track if we've done our "on mount" logic
  const [hasMounted, setHasMounted] = useState(false);

  // -----------------------------
  // 1) On mount, parse URL & load cache from localStorage
  // -----------------------------
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let urlQuery = searchParams.get('q') || '';
    let urlPage = parseInt(searchParams.get('page') || '0', 10);
    let urlLimit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate
    if (isNaN(urlPage) || urlPage < 0) urlPage = 0;
    if (isNaN(urlLimit) || urlLimit < 1) urlLimit = 20;

    // Attempt to load an existing localStorage cache
    const storedCache = localStorage.getItem('searchCache');
    if (storedCache) {
      try {
        const parsed = JSON.parse(storedCache);
        setCache(parsed);
      } catch {
        // If parse fails, ignore and use empty object
      }
    }

    // Initialize states from URL
    setQuery(urlQuery);
    setPage(urlPage);
    setLimit(urlLimit);

    setHasMounted(true);
  }, [location.search]);

  // -----------------------------
  // 2) Whenever query/page/limit changes, update the URL
  //    Then see if we have a cached result for that combination.
  // -----------------------------
  useEffect(() => {
    if (!hasMounted) return;

    // Update the URL to reflect the new state
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (page > 0) params.set('page', String(page));
    if (limit !== 20) params.set('limit', String(limit));

    navigate(`?${params.toString()}`, {replace: true});

    // If there's no query, clear results
    if (!query) {
      setResults([]);
      setTotal(0);
      return;
    }

    // Build a cache key like "q=samsung&page=0&limit=20"
    const key = params.toString(); // i.e. "q=samsung&page=0&limit=20"

    // Check if we have cached data for this key
    if (cache[key]) {
      // If found, use it immediately to avoid re-fetch
      const {results: cachedResults, total: cachedTotal} = cache[key];
      setResults(cachedResults);
      setTotal(cachedTotal);
      setLoading(false);
      setError('');
    } else {
      // If not in cache, fetch from server
      fetchResults(query, page, limit).catch(() => {});
    }
  }, [query, page, limit, hasMounted]);

  // -----------------------------
  // 3) Sync the cache object to localStorage whenever it changes
  // -----------------------------
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem('searchCache', JSON.stringify(cache));
  }, [cache, hasMounted]);

  // -----------------------------
  // 4) The fetch function: store result in both React state and local cache
  // -----------------------------
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

      // Save to cache
      const key = `q=${searchTerm}&page=${pageNum}&limit=${limitNum}`;
      setCache((prev) => ({
        ...prev,
        [key]: {
          results: data.results || [],
          total: data.total || 0,
        },
      }));
    } catch (err) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // 5) Handlers for user input
  // -----------------------------
  function handleSubmit(e) {
    e.preventDefault();
    setPage(0);
    setResults([]);
    setTotal(0);
    setError('');
    // Setting query triggers the effect which updates URL & fetch if needed
    setQuery(query.trim());
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

  const edges = results.map((product) => ({
    node: {
      ...product,
      id: product.product_id,
    },
  }));

  return (
    <div className="search">
      <h1>{initialMessage}</h1>
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">
          Search
        </button>
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(0);
            setResults([]);
            setTotal(0);
          }}
          className="search-select"
        >
          <option value="10">10 per page</option>
          <option value="20">20 per page</option>
          <option value="50">50 per page</option>
        </select>
      </form>

      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}

      {edges.length > 0 && (
        <>
          <p>
            Showing {edges.length} results on page {page + 1} of{' '}
            {Math.ceil(total / limit)} (total {total})
          </p>
          <div className="search-results-grid">
            {edges.map(({node: product}) => (
              <div key={product.id} className="product-card">
                <Link to={`/products/${encodeURIComponent(product.handle)}`}>
                  {product.image_url && (
                    <div
                      className="product-slideshow"
                      style={{position: 'relative', overflow: 'hidden'}}
                    >
                      <img
                        src={product.image_url}
                        alt={product.title}
                        className="product-slideshow-image"
                        style={{
                          width: '180px',
                          height: '180px',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                  )}
                  <h4 className="product-title">{product.title}</h4>
                  <div className="product-price">
                    {product.price ? (
                      <Money
                        data={{amount: product.price, currencyCode: 'USD'}}
                      />
                    ) : (
                      <span>No Price</span>
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>
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
