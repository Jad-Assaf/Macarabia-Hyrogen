import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link, useNavigate, useLocation} from '@remix-run/react';
import React, {useState, useEffect, useCallback} from 'react';
import {Money, Image} from '@shopify/hydrogen';
import {debounce} from 'lodash';
import '../styles/SearchPage.css';

// Helper: truncate text to a given length.
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

// ----------------------
// New SearchBar Component with Predictive Product Results
// ----------------------
function SearchBar({onResultSelect, closeSearch}) {
  const [query, setQuery] = useState('');
  const [instantResults, setInstantResults] = useState([]);
  const [error, setError] = useState(null);

  // Debounced fetch from the search endpoint with a limit of 10 products.
  const debouncedFetch = useCallback(
    debounce(async (q) => {
      if (!q) {
        setInstantResults([]);
        return;
      }
      try {
        const response = await fetch(
          `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(
            q,
          )}&limit=10`,
        );
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        const data = await response.json();
        setInstantResults(data.results || []);
      } catch (err) {
        setError(err.message);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedFetch(query);
    return () => debouncedFetch.cancel();
  }, [query, debouncedFetch]);

  return (
    <div className="instant-search-bar">
      <input
        type="text"
        placeholder="Type to search instantly..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setError(null);
        }}
      />
      {error && <p className="error">{error}</p>}
      {instantResults.length > 0 && (
        <div className="predictive-search-result" key="products">
          <h5>Products</h5>
          <ul>
            {instantResults.slice(0, 10).map((product) => {
              const productUrl = `/products/${encodeURIComponent(
                product.handle,
              )}`;
              return (
                <li
                  className="predictive-search-result-item"
                  key={product.product_id}
                >
                  <Link
                    to={productUrl}
                    onClick={() => {
                      if (closeSearch) closeSearch();
                      onResultSelect(product);
                    }}
                  >
                    {product.image_url && (
                      <Image
                        alt={product.title}
                        src={product.image_url}
                        width={50}
                        height={50}
                      />
                    )}
                    <div className="search-result-txt">
                      <div className="search-result-titDesc">
                        <p className="search-result-title">
                          {truncateText(product.title, 75)}
                        </p>
                        <p className="search-result-description">
                          {truncateText(product.description, 100)}
                        </p>
                        {product.sku && (
                          <p className="search-result-description">
                            SKU: {product.sku}
                          </p>
                        )}
                      </div>
                      <small className="search-result-price">
                        {Number(product.price) === 0 ? (
                          'Call for Price!'
                        ) : (
                          <Money data={product.price} />
                        )}
                      </small>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ----------------------
// Main SearchTest Component
// ----------------------
export async function loader({request}) {
  const url = new URL(request.url);
  const q = url.searchParams.get('q') || '';

  // Call your external API
  const externalResponse = await fetch(
    `https://search-app-vert.vercel.app/api/search?q=${encodeURIComponent(q)}`,
  );
  const data = await externalResponse.json();

  return json({
    result: {
      items: data.results || [],
      total: data.total || 0,
    },
  });
}

export default function SearchTest() {
  const {initialMessage} = useLoaderData();

  // We use `inputQuery` for the text input, and `searchQuery` for the
  // term we actually fetch with.
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
  const [cache, setCache] = useState({});

  const location = useLocation();
  const navigate = useNavigate();
  const [hasMounted, setHasMounted] = useState(false);

  // 1) On mount, parse URL & load cache from localStorage
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let urlQuery = searchParams.get('q') || '';
    let urlPage = parseInt(searchParams.get('page') || '0', 10);
    let urlLimit = parseInt(searchParams.get('limit') || '20', 10);

    if (isNaN(urlPage) || urlPage < 0) urlPage = 0;
    if (isNaN(urlLimit) || urlLimit < 1) urlLimit = 20;

    const storedCache = localStorage.getItem('searchCache');
    if (storedCache) {
      try {
        const parsed = JSON.parse(storedCache);
        setCache(parsed);
      } catch {
        // ignore parse errors
      }
    }

    setInputQuery(urlQuery);
    setSearchQuery(urlQuery);
    setPage(urlPage);
    setLimit(urlLimit);
    setHasMounted(true);
  }, [location.search]);

  // 2) Update URL & fetch when searchQuery/page/limit change
  useEffect(() => {
    if (!hasMounted) return;

    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (page > 0) params.set('page', String(page));
    if (limit !== 20) params.set('limit', String(limit));
    navigate(`?${params.toString()}`, {replace: true});

    if (!searchQuery) {
      setResults([]);
      setTotal(0);
      return;
    }

    const key = params.toString();
    if (cache[key]) {
      const {results: cachedResults, total: cachedTotal} = cache[key];
      setResults(cachedResults);
      setTotal(cachedTotal);
      setLoading(false);
      setError('');
    } else {
      fetchResults(searchQuery, page, limit).catch(() => {});
    }
  }, [searchQuery, page, limit, hasMounted]);

  // 3) Sync cache to localStorage
  useEffect(() => {
    if (!hasMounted) return;
    localStorage.setItem('searchCache', JSON.stringify(cache));
  }, [cache, hasMounted]);

  // 4) Fetch function to update state and cache
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

  // 5) On submit, update searchQuery to trigger fetch
  function handleSubmit(e) {
    e.preventDefault();
    setPage(0);
    setResults([]);
    setTotal(0);
    setError('');
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

  // Callback when an instant search result is selected.
  function handleInstantResultSelect(item) {
    setInputQuery(item.title);
    setSearchQuery(item.title);
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

      {/* Render the new instant search bar component */}
      <SearchBar
        onResultSelect={handleInstantResultSelect}
        closeSearch={() => {}}
      />

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
                      <p>${(Number(product.price) / 100).toFixed(2)}</p>
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
