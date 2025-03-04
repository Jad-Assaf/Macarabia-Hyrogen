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

  // We use `inputQuery` for the text input, and `searchQuery` for the
  // term we actually fetch with. That way we only fetch on submit.
  const [inputQuery, setInputQuery] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);

  // For data/results
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Local cache object where each key is like "q=watch&page=0&limit=20"
  // This lives in React state, but is also synced to localStorage so it persists.
  const [cache, setCache] = useState({});

  const location = useLocation();
  const navigate = useNavigate();

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
    setInputQuery(urlQuery); // so the input field matches the URL on first load
    setSearchQuery(urlQuery); // so we can do a fetch if there's a query
    setPage(urlPage);
    setLimit(urlLimit);

    setHasMounted(true);
  }, [location.search]);

  // -----------------------------
  // 2) Whenever searchQuery/page/limit change, update the URL + possibly fetch
  //    (But only if we have a non-empty searchQuery)
  // -----------------------------
  useEffect(() => {
    if (!hasMounted) return;

    // Build updated URL
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (page > 0) params.set('page', String(page));
    if (limit !== 20) params.set('limit', String(limit));

    // Update the browser URL (no fetch on each letter, only on submit)
    navigate(`?${params.toString()}`, {replace: true});

    // If searchQuery is empty, clear results
    if (!searchQuery) {
      setResults([]);
      setTotal(0);
      return;
    }

    // Build a cache key like "q=watch&page=0&limit=20"
    const key = params.toString();

    // Check if we have cached data for this exact combination
    if (cache[key]) {
      // Use the cache immediately, skip network
      const {results: cachedResults, total: cachedTotal} = cache[key];
      setResults(cachedResults);
      setTotal(cachedTotal);
      setLoading(false);
      setError('');
    } else {
      // Not in cache, fetch from server
      fetchResults(searchQuery, page, limit).catch(() => {});
    }
  }, [searchQuery, page, limit, hasMounted]);

  // -----------------------------
  // 3) Sync the cache object to localStorage whenever it changes
  // -----------------------------
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem('searchCache', JSON.stringify(cache));
  }, [cache, hasMounted]);

  // -----------------------------
  // 4) The fetch function: store the result in both React state and local cache
  // -----------------------------
  async function fetchResults(term, pageNum, limitNum) {
    setLoading(true);
    setError('');
    try {
      const url = new URL('https://search-app-vert.vercel.app/api/search');
      url.searchParams.set('q', term);
      url.searchParams.set('page', pageNum);
      url.searchParams.set('limit', limitNum);

      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error(`Request failed, status: ${response.status}`);
      }
      const data = await response.json();
      setResults(data.results || []);
      setTotal(data.total || 0);

      // Save into cache
      const key = `q=${term}&page=${pageNum}&limit=${limitNum}`;
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
  // 5) Only on submit do we set `searchQuery` from `inputQuery`
  //    -> triggers the effect to do a fetch (or load from cache)
  // -----------------------------
  function handleSubmit(e) {
    e.preventDefault();
    setPage(0);
    setResults([]);
    setTotal(0);
    setError('');

    // Move the typed input into searchQuery, which triggers the effect.
    setSearchQuery(inputQuery.trim());
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

  // Transform results for rendering
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
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
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
            // If desired, we can also reset results or leave them
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
                    {product.price != null ? (
                      <Money
                        data={{
                          amount: Number(product.price) / 100,
                          currencyCode: 'USD',
                        }}
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
