import {json} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams, useNavigate} from '@remix-run/react';
import React, {useState, useEffect} from 'react';
import '../styles/SearchPage.css';
import {ProductItem} from '~/components/CollectionDisplay';

// Optional server loader for initial data.
export async function loader() {
  return json({initialMessage: 'Search Page'});
}

// Helper: transform DB product into shape expected by ProductItem
function transformProduct(prod) {
  return {
    ...prod,
    id: prod.product_id, // ensure product.id exists
    // Simulate images object with a single node if image_url exists.
    images: {
      nodes: prod.image_url
        ? [{url: prod.image_url, altText: prod.title || 'Product image'}]
        : [],
    },
    // Simulate variants object with one variant. Adjust availableForSale as needed.
    variants: {
      nodes: [
        {
          id: prod.product_id + '-variant',
          sku: prod.sku,
          availableForSale: true, // Assume available (change if needed)
          price: {amount: prod.price, currencyCode: 'USD'}, // Adjust currency if needed
          compareAtPrice: null,
        },
      ],
    },
  };
}

export default function SearchTest() {
  const {initialMessage} = useLoaderData();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]); // array of product objects from DB
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!query) {
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
    setPage(0);
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

  // Transform the results into an "edges" array with a node property,
  // and convert each product record using transformProduct().
  const edges = results.map((product) => ({
    node: transformProduct(product),
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
            {edges.map(({node: product}, idx) => (
              <ProductItem product={product} index={idx} key={product.id} />
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
