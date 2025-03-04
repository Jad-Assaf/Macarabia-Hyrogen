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
  const location = useLocation(); // for reading ?q=... from the URL
  const navigate = useNavigate(); // to programmatically update the URL

  // Local state
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Track if we've done our "on mount" logic
  const [hasMounted, setHasMounted] = useState(false);

  // 1) Parse URL search params on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    let urlQuery = searchParams.get('q') || '';
    let urlPage = parseInt(searchParams.get('page') || '0', 10);
    let urlLimit = parseInt(searchParams.get('limit') || '20', 10);

    // Validate them
    if (isNaN(urlPage) || urlPage < 0) urlPage = 0;
    if (isNaN(urlLimit) || urlLimit < 1) urlLimit = 20;

    // 2) Check localStorage for a matching state
    const saved = localStorage.getItem('searchState');
    if (saved) {
      const parsed = JSON.parse(saved);

      // If localStorage matches what’s in the URL, restore the saved results
      // so we don't have to fetch again immediately.
      if (
        parsed.query === urlQuery &&
        parsed.page === urlPage &&
        parsed.limit === urlLimit
      ) {
        setQuery(parsed.query);
        setResults(parsed.results || []);
        setPage(parsed.page);
        setLimit(parsed.limit);
        setTotal(parsed.total || 0);
        setError('');
        setLoading(false);
        setHasMounted(true);
        return; // skip immediate fetch
      }
    }

    // Otherwise, set initial states from URL, but we will fetch fresh data
    setQuery(urlQuery);
    setPage(urlPage);
    setLimit(urlLimit);
    setHasMounted(true);
  }, [location.search]);

  // 3) Whenever query/page/limit change, update the URL & possibly fetch
  useEffect(() => {
    if (!hasMounted) return;
    // Update URL to reflect the new state
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (page > 0) params.set('page', String(page));
    if (limit !== 20) params.set('limit', String(limit));

    // If your route is just /search, we might do:
    navigate(`?${params.toString()}`, {replace: true});

    // If there's a query, we fetch new results
    if (query) {
      fetchResults(query, page, limit);
    } else {
      // If no query, clear results
      setResults([]);
      setTotal(0);
    }
  }, [query, page, limit, hasMounted]);

  // 4) Each time we get new data, store it in localStorage
  useEffect(() => {
    if (!hasMounted) return;
    const dataToStore = {
      query,
      results,
      page,
      limit,
      total,
    };
    localStorage.setItem('searchState', JSON.stringify(dataToStore));
  }, [query, page, limit, total, results, hasMounted]);

  // The actual fetch function
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

  // The user-initiated search
  function handleSubmit(e) {
    e.preventDefault();
    // Reset to page 0 whenever the user explicitly searches
    setPage(0);
    setResults([]);
    setTotal(0);
    // setQuery triggers the effect which in turn calls fetchResults.
    // The new query/page/limit will cause a new fetch in useEffect.
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

  // Transform the results to mimic an "edges" array with a node property:
  const edges = results.map((product) => ({
    node: {
      ...product,
      id: product.product_id, // map product_id to id
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
