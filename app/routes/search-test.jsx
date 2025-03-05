import {json} from '@shopify/remix-oxygen';
import {useLoaderData, Link, useNavigate, useLocation} from '@remix-run/react';
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {Money, Image} from '@shopify/hydrogen';
import {debounce} from 'lodash';
import '../styles/SearchPage.css';

// Helper: truncate text to a given length.
function truncateText(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export function SearchBar({onResultSelect, closeSearch}) {
  const [query, setQuery] = useState('');
  const [instantResults, setInstantResults] = useState([]);
  const [error, setError] = useState(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [isSearchResultsVisible, setSearchResultsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // new state for loading

  const inputRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Debounced fetch from the search endpoint with a limit of 10 products.
  const debouncedFetch = useCallback(
    debounce(async (q) => {
      if (!q) {
        setInstantResults([]);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
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
        setIsLoading(false);
      } catch (err) {
        setError(err.message);
        setIsLoading(false);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    debouncedFetch(query);
    return () => debouncedFetch.cancel();
  }, [query, debouncedFetch]);

  // Handle focus: on small screens, add fixed positioning and show overlay.
  const handleFocus = () => {
    if (window.innerWidth < 1024) {
      searchContainerRef.current?.classList.add('fixed-search');
      setOverlayVisible(true);
    }
    setSearchResultsVisible(true);
  };

  // Handle blur: on small screens, if input is empty, remove fixed positioning and hide overlay.
  const handleBlur = () => {
    if (window.innerWidth < 1024) {
      const inputValue = inputRef.current?.value.trim();
      if (!inputValue) {
        searchContainerRef.current?.classList.remove('fixed-search');
        setOverlayVisible(false);
      }
    }
  };

  // Closes the search overlay and results.
  const handleCloseSearch = () => {
    searchContainerRef.current?.classList.remove('fixed-search');
    setOverlayVisible(false);
    setSearchResultsVisible(false);
  };

  // Handle Enter key to trigger search.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent default form submission
      handleSearch();
    }
  };

  // Trigger search (here you can also add tracking or redirection logic)
  const handleSearch = () => {
    if (inputRef.current) {
      const rawTerm = inputRef.current.value.trim();
      const term = rawTerm.replace(/\s+/g, '-');
      if (rawTerm) {
        // Optionally: trackSearch(rawTerm);
        window.location.href = `/search?q=${term}`;
      }
    }
  };

  // Clear the search input and reset results.
  const handleClearSearch = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setQuery('');
    setSearchResultsVisible(false);
    setInstantResults([]);
  };

  // Manage scroll-lock when overlay is visible.
  useEffect(() => {
    if (isOverlayVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOverlayVisible]);

  return (
    <>
      {/* Fullscreen Overlay */}
      <div
        className={`search-overlay ${isOverlayVisible ? 'active' : ''}`}
        onClick={handleCloseSearch}
      ></div>

      {/* Main Search Form */}
      <div ref={searchContainerRef} className="main-search">
        <div className="search-container">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search products"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
              setSearchResultsVisible(true);
            }}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="search-bar"
          />
          {inputRef.current?.value && (
            <button
              className="clear-search-button"
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <svg
                fill="#000"
                height="12px"
                width="12px"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 460.775 460.775"
              >
                <path d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55 c-4.127,0-8.08,1.639-10.993,4.55l-171.138,171.14L59.25,4.565c-2.913-2.911-6.866-4.55-10.993-4.55 c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128L4.575,401.505 c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55c4.127,0,8.08-1.639,10.994-4.55l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"></path>
              </svg>
            </button>
          )}
          <button
            onClick={handleSearch}
            className="search-bar-submit"
            aria-label="Search"
          >
            <SearchIcon />
          </button>
        </div>
        {isSearchResultsVisible && (
          <div className="search-results-container">
            {isLoading ? (
              <div className="predictive-search-result" key="skeleton">
                <h5>Products</h5>
                <ul>
                  {[...Array(5)].map((_, i) => (
                    <li key={i} className="predictive-search-result-item">
                      {/* You can wrap each part with its skeleton class */}
                      <div className="search-result-txt">
                        <div className="search-result-titDesc">
                          {/* Skeleton for image */}
                          <div className="skeleton skeleton-image"></div>
                          <div>
                            {/* Skeleton for title */}
                            <p className="skeleton skeleton-title"></p>
                            {/* Skeleton for description */}
                            <p className="skeleton skeleton-description"></p>
                            {/* Skeleton for SKU */}
                            <p className="skeleton skeleton-sku"></p>
                          </div>
                        </div>
                        {/* Skeleton for price */}
                        <small className="skeleton skeleton-price"></small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              // Render actual results if available
              instantResults.length > 0 && (
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
                                  <p>
                                    ${(Number(product.price) / 100).toFixed(2)}
                                  </p>
                                )}
                              </small>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ----------------------
// Search Icon Component (used in SearchBar)
// ----------------------
function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="#000"
      width="30px"
      height="30px"
    >
      <path
        d="M15.7955 15.8111L21 21M18 10.5C18 14.6421 14.6421 18 10.5 18C6.35786 18 3 14.6421 3 10.5C3 6.35786 6.35786 3 10.5 3C14.6421 3 18 6.35786 18 10.5Z"
        stroke="#000"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
