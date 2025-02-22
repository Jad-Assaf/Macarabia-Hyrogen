import {json} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  useSearchParams,
  useNavigate,
  Link,
} from '@remix-run/react';
import {useState, useEffect} from 'react';
import {ProductItem} from '~/components/CollectionDisplay';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import {trackSearch} from '~/lib/metaPixelEvents';
import '../styles/SearchPage.css';

import {Client} from 'pg'; // <-- New: we'll use pg for Postgres

/**
 * @type {import('@remix-run/react').MetaFunction}
 */
export const meta = () => {
  return [{title: `Macarabia | Search`}];
};

/**
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const usePrefix = searchParams.get('prefix') === 'true';

  // -----------------------------------------
  // Predictive Search (still uses Shopify)
  // -----------------------------------------
  const isPredictive = searchParams.has('predictive');
  if (isPredictive) {
    const result = await predictiveSearch({request, context, usePrefix}).catch(
      (error) => {
        console.error('Predictive Search Error:', error);
        return {
          type: 'predictive',
          term: '',
          result: null,
          error: error.message,
        };
      },
    );
    return json({
      ...result,
      vendors: [],
      productTypes: [],
      pageInfo: {},
    });
  }

  // -----------------------------------------
  // Parse after/before for cursor-based pagination
  // For demonstration, treat them as numeric offsets.
  // -----------------------------------------
  const after = Number(searchParams.get('after')) || 0;
  const before = Number(searchParams.get('before')) || 0;

  // -----------------------------------------
  // Build filters with OR logic for multiple values
  // (we won't implement them in the SQL example below,
  // but kept for demonstration)
  // -----------------------------------------
  const shopifyKeyMap = {
    vendor: 'vendor',
    productType: 'product_type',
  };
  const filterMap = new Map();
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_')) {
      const rawKey = key.replace('filter_', '');
      if (!filterMap.has(rawKey)) {
        filterMap.set(rawKey, []);
      }
      filterMap.get(rawKey).push(value);
    }
  }
  const filterQueryParts = [];
  for (const [rawKey, values] of filterMap.entries()) {
    const pgColumn = shopifyKeyMap[rawKey] || rawKey;
    if (values.length === 1) {
      // e.g. vendor = 'Nike'
      filterQueryParts.push(`${pgColumn} = '${values[0]}'`);
    } else {
      // e.g. (vendor = 'Nike' OR vendor = 'Adidas')
      const orGroup = values.map((v) => `${pgColumn} = '${v}'`).join(' OR ');
      filterQueryParts.push(`(${orGroup})`);
    }
  }

  // -----------------------------------------
  // Price range & text search
  // -----------------------------------------
  const rawTerm = searchParams.get('q') || '';
  const normalizedTerm = rawTerm.replace(/-/g, ' ');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Build your fuzzy target from the user input
  // (if usePrefix => maybe partial substring, etc.)
  // For demonstration, we’ll keep it simple:
  const fuzzyTerm = normalizedTerm.trim();

  // Optionally incorporate filters
  // e.g. WHERE title % $1 AND vendor = 'Nike' ...
  // We'll pass them to the function
  const whereFilters = filterQueryParts;

  // -----------------------------------------
  // Sort
  // -----------------------------------------
  const sortKeyMapping = {
    featured: 'similarity', // just an example fallback
    'price-low-high': 'price',
    'price-high-low': 'price',
    'best-selling': 'id', // or some custom field
    newest: 'created_at', // or your actual date field
  };
  const sortKey = sortKeyMapping[searchParams.get('sort')] || 'similarity';
  const reverseMap = {
    'price-high-low': true,
  };
  const reverse = reverseMap[searchParams.get('sort')] || false;

  // -----------------------------------------
  // Perform fuzzy search in Postgres
  // -----------------------------------------
  const result = await fuzzySearchInPostgres({
    fuzzyTerm,
    whereFilters,
    sortKey,
    reverse,
    offset: after || 0, // using after as offset
    limit: 50,
  }).catch((error) => {
    console.error('Search Error (Postgres):', error);
    return {term: '', result: null, error: error.message};
  });

  // -----------------------------------------
  // Extract unique vendor/productType from results
  // so we can show filters
  // -----------------------------------------
  const filteredVendors = [
    ...new Set(result?.result?.products?.edges.map(({node}) => node.vendor)),
  ].sort();
  const filteredProductTypes = [
    ...new Set(
      result?.result?.products?.edges.map(({node}) => node.productType),
    ),
  ].sort();

  return json({
    ...result,
    vendors: filteredVendors,
    productTypes: filteredProductTypes,
  });
}

/* ------------------------------------------------------------------
   Fuzzy Search in Postgres
------------------------------------------------------------------- */
async function fuzzySearchInPostgres({
  fuzzyTerm,
  whereFilters = [],
  sortKey = 'similarity',
  reverse = false,
  offset = 0,
  limit = 50,
}) {
  // Initialize PG client
  const client = new Client({
    connectionString: process.env.PG_CONNECTION_STRING,
  });
  await client.connect();

  // Build WHERE clause
  // Using the Postgres trigram operator (%). Example:
  //   title % $1 or we can do: (title % $1 OR description % $1)
  let whereClause = `title % $1`;
  if (whereFilters.length > 0) {
    const filtersJoined = whereFilters.join(' AND ');
    whereClause += ` AND ${filtersJoined}`;
  }

  // In this example, we’ll compute similarity and then order by it:
  //   ORDER BY similarity(title, $1)
  // If your sortKey is something else (price, created_at), handle separately.
  let orderClause = `ORDER BY similarity(title, $1) DESC`;
  if (sortKey !== 'similarity') {
    // We'll just do a basic dynamic sort on a column
    orderClause = `ORDER BY ${sortKey} ${reverse ? 'DESC' : 'ASC'}`;
  }

  // Example query using trigram similarity
  // offset/limit for pagination
  const queryText = `
    SELECT
      id,
      title,
      vendor,
      product_type,
      description,
      price,         -- example
      image_url,     -- example
      created_at     -- example
    FROM products
    WHERE ${whereClause}
    ${orderClause}
    LIMIT $2
    OFFSET $3
  `;

  const values = [fuzzyTerm, limit, offset];
  const {rows} = await client.query(queryText, values);

  await client.end();

  // Transform these into the structure your UI code expects:
  // e.g. {result: {products: {edges: [...], pageInfo: {...}}}}
  const edges = rows.map((row) => ({
    node: {
      id: String(row.id),
      title: row.title,
      vendor: row.vendor,
      productType: row.product_type,
      description: row.description,
      // example: transform your DB columns to match needed fields
      images: {
        nodes: [{url: row.image_url, altText: row.title}],
      },
      priceRange: {
        minVariantPrice: {
          amount: String(row.price || 0),
          currencyCode: 'USD', // or your currency
        },
      },
      variants: {
        nodes: [],
      },
    },
  }));

  // Fake hasNextPage / hasPreviousPage if needed, or compute from total count
  const pageInfo = {
    hasNextPage: rows.length === limit, // naive check
    hasPreviousPage: offset > 0,
    startCursor: offset,
    endCursor: offset + rows.length,
  };

  return {
    type: 'regular',
    term: fuzzyTerm,
    result: {
      products: {
        edges,
        pageInfo,
      },
    },
  };
}

/* ------------------------------------------------------------------
   The React Component (unchanged from your code)
------------------------------------------------------------------- */
export default function SearchPage() {
  const {
    type,
    term,
    result,
    vendors = [],
    productTypes = [],
    error,
  } = useLoaderData();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Price range local states
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Desktop filter toggles
  const [showVendors, setShowVendors] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [showPriceRange, setShowPriceRange] = useState(false);

  // Mobile filters
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileShowVendors, setMobileShowVendors] = useState(false);
  const [mobileShowProductTypes, setMobileShowProductTypes] = useState(false);
  const [mobileShowPriceRange, setMobileShowPriceRange] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const closeMobileFilters = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMobileFiltersOpen(false);
      setIsClosing(false);
    }, 300);
  };

  // Filter changes (already supports multiple filters)
  const handleFilterChange = (filterKey, value, checked) => {
    const params = new URLSearchParams(searchParams);

    if (checked) {
      params.append(`filter_${filterKey}`, value);
    } else {
      const currentFilters = params.getAll(`filter_${filterKey}`);
      const updatedFilters = currentFilters.filter((item) => item !== value);
      params.delete(`filter_${filterKey}`);
      updatedFilters.forEach((item) =>
        params.append(`filter_${filterKey}`, item),
      );
    }

    // Reset cursors
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  // Sorting
  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
    // Reset cursors
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  // Price filter
  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (minPrice) {
      params.set('minPrice', minPrice);
    } else {
      params.delete('minPrice');
    }
    if (maxPrice) {
      params.set('maxPrice', maxPrice);
    } else {
      params.delete('maxPrice');
    }
    // Reset cursors
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  // Track Search event
  useEffect(() => {
    if (term) {
      trackSearch(term);
    }
  }, [term]);

  // If we have no products, show "no results"
  const edges = result?.products?.edges || [];
  if (!edges.length) {
    return (
      <div className="search">
        <h1>Search Results</h1>
        <p>No results found</p>
      </div>
    );
  }

  // Grab pageInfo so we know if there's a next / prev page
  const pageInfo = result?.products?.pageInfo || {};
  const hasNextPage = pageInfo.hasNextPage;
  const hasPreviousPage = pageInfo.hasPreviousPage;

  // Handler: next => treat endCursor as offset
  const goNext = () => {
    if (!hasNextPage) return;
    const params = new URLSearchParams(searchParams);
    params.set('after', pageInfo.endCursor); // offset = end
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  // Handler: prev => treat startCursor as offset
  const goPrev = () => {
    if (!hasPreviousPage) return;
    const params = new URLSearchParams(searchParams);
    params.set('before', pageInfo.startCursor); // offset = start
    params.delete('after');
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="search">
      <h1>Search Results</h1>

      <div className="search-filters-container" style={{display: 'flex'}}>
        {/* Sidebar (Desktop) */}
        <div className="filters">
          <fieldset>
            <button
              type="button"
              onClick={() => setShowVendors(!showVendors)}
              className="filter-toggle"
              aria-expanded={showVendors}
            >
              Vendors <span>{showVendors ? '-' : '+'}</span>
            </button>
            {showVendors && (
              <div>
                {vendors.map((vendor) => {
                  const isChecked = searchParams
                    .getAll('filter_vendor')
                    .includes(vendor);
                  return (
                    <div key={vendor} className="filter-option">
                      <input
                        type="checkbox"
                        id={`vendor-${vendor}`}
                        value={vendor}
                        checked={isChecked}
                        onChange={(e) =>
                          handleFilterChange('vendor', vendor, e.target.checked)
                        }
                      />
                      <label
                        className="filter-label"
                        htmlFor={`vendor-${vendor}`}
                      >
                        {vendor}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>

          <fieldset>
            <button
              type="button"
              onClick={() => setShowProductTypes(!showProductTypes)}
              className="filter-toggle"
              aria-expanded={showProductTypes}
            >
              Product Types <span>{showProductTypes ? '-' : '+'}</span>
            </button>
            {showProductTypes && (
              <div>
                {productTypes.map((ptype) => {
                  const isChecked = searchParams
                    .getAll('filter_productType')
                    .includes(ptype);
                  return (
                    <div key={ptype} className="filter-option">
                      <input
                        type="checkbox"
                        id={`productType-${ptype}`}
                        value={ptype}
                        checked={isChecked}
                        onChange={(e) =>
                          handleFilterChange(
                            'productType',
                            ptype,
                            e.target.checked,
                          )
                        }
                      />
                      <label
                        className="filter-label"
                        htmlFor={`productType-${ptype}`}
                      >
                        {ptype}
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </fieldset>

          <fieldset>
            <button
              type="button"
              onClick={() => setShowPriceRange(!showPriceRange)}
              className="filter-toggle"
              aria-expanded={showPriceRange}
            >
              Price Range <span>{showPriceRange ? '-' : '+'}</span>
            </button>
            {showPriceRange && (
              <div>
                <div>
                  <label>
                    Min Price:
                    <input
                      type="number"
                      name="minPrice"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="price-filter-btn"
                    />
                  </label>
                </div>
                <div>
                  <label>
                    Max Price:
                    <input
                      type="number"
                      name="maxPrice"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="price-filter-btn"
                    />
                  </label>
                </div>
                <button
                  className="price-filter-apply"
                  onClick={applyPriceFilter}
                >
                  Apply
                </button>
              </div>
            )}
          </fieldset>
        </div>

        {/* Main Search Results */}
        <div className="search-results">
          {/* Sorting */}
          <div>
            <label htmlFor="sort-select">Sort by:</label>
            <select
              id="sort-select"
              onChange={handleSortChange}
              value={searchParams.get('sort') || 'featured'}
            >
              <option value="featured">Featured</option>
              <option value="price-low-high">Price: Low - High</option>
              <option value="price-high-low">Price: High - Low</option>
              <option value="best-selling">Best Selling</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Product Grid */}
          <div className="search-results-grid">
            {edges.map(({node: product}, idx) => (
              <ProductItem product={product} index={idx} key={product.id} />
            ))}
          </div>

          {/* Prev / Next Buttons */}
          <div
            style={{
              marginTop: '1rem',
              display: 'flex',
              justifyContent: 'center',
              gap: '50px',
            }}
          >
            {pageInfo.hasPreviousPage && (
              <button
                onClick={goPrev}
                style={{
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  border: '1px solid #d1d7db',
                  borderRadius: '30px',
                }}
              >
                ← Previous Page
              </button>
            )}
            {pageInfo.hasNextPage && (
              <button
                onClick={goNext}
                style={{
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  padding: '5px 10px',
                  border: '1px solid #d1d7db',
                  borderRadius: '30px',
                }}
              >
                Next Page →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters */}
      <button
        className="mobile-filters-toggle"
        onClick={() => setIsMobileFiltersOpen(true)}
      >
        Filter
      </button>

      {isMobileFiltersOpen && (
        <div className="mobile-filters-overlay">
          <div className={`mobile-filters-panel ${isClosing ? 'closing' : ''}`}>
            <hr className="mobile-filters-hr" />
            <button
              className="close-mobile-filters"
              onClick={closeMobileFilters}
            >
              <svg
                fill="#000"
                height="30px"
                width="30px"
                viewBox="0 0 460.775 460.775"
              >
                <g>
                  <path
                    d="M285.08,230.397L456.218,59.27
                    c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565c-2.913-2.911-6.866-4.55-10.992-4.55
                    c-4.127,0-8.08,1.639-10.993,4.55L285.08,171.705L59.25,4.565
                    c-2.913-2.911-6.866-4.55-10.993-4.55
                    c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284
                    c-6.077,6.075-6.077,15.909,0,21.986l171.138,171.128
                    L4.575,401.505c-6.074,6.077-6.074,15.911,0,21.986
                    l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55
                    c4.127,0,8.08-1.639,10.994-4.55l171.117-171.12
                    l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55
                    c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719
                    c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"
                  />
                </g>
              </svg>
            </button>

            <fieldset>
              <button
                type="button"
                onClick={() => setMobileShowVendors(!mobileShowVendors)}
              >
                Vendors <span>{mobileShowVendors ? '-' : '+'}</span>
              </button>
              {mobileShowVendors && (
                <div className="filter-options-container">
                  {vendors.map((vendor) => {
                    const isChecked = searchParams
                      .getAll('filter_vendor')
                      .includes(vendor);
                    return (
                      <div key={vendor} className="filter-option">
                        <input
                          type="checkbox"
                          id={`mobile-vendor-${vendor}`}
                          value={vendor}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange(
                              'vendor',
                              vendor,
                              e.target.checked,
                            )
                          }
                        />
                        <label htmlFor={`mobile-vendor-${vendor}`}>
                          {vendor}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset>
              <button
                type="button"
                onClick={() =>
                  setMobileShowProductTypes(!mobileShowProductTypes)
                }
              >
                Product Types <span>{mobileShowProductTypes ? '-' : '+'}</span>
              </button>
              {mobileShowProductTypes && (
                <div className="filter-options-container">
                  {productTypes.map((type) => {
                    const isChecked = searchParams
                      .getAll('filter_productType')
                      .includes(type);
                    return (
                      <div key={type} className="filter-option">
                        <input
                          type="checkbox"
                          id={`mobile-productType-${type}`}
                          value={type}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange(
                              'productType',
                              type,
                              e.target.checked,
                            )
                          }
                        />
                        <label htmlFor={`mobile-productType-${type}`}>
                          {type}
                        </label>
                      </div>
                    );
                  })}
                </div>
              )}
            </fieldset>

            <fieldset>
              <button
                type="button"
                onClick={() => setMobileShowPriceRange(!mobileShowPriceRange)}
              >
                Price Range <span>{mobileShowPriceRange ? '-' : '+'}</span>
              </button>
              {mobileShowPriceRange && (
                <div className="mobile-price-filter-container">
                  <div className="mobile-min-price-filter">
                    <label>
                      Min Price:
                      <input
                        type="number"
                        name="minPrice"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                      />
                    </label>
                  </div>
                  <div className="mobile-max-price-filter">
                    <label>
                      Max Price:
                      <input
                        type="number"
                        name="maxPrice"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                      />
                    </label>
                  </div>
                  <button onClick={applyPriceFilter}>Apply</button>
                </div>
              )}
            </fieldset>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   PREDICTIVE SEARCH (unchanged from your code)
------------------------------------------------------------------- */
const PREDICTIVE_SEARCH_ARTICLE_FRAGMENT = `#graphql
  fragment PredictiveArticle on Article {
    __typename
    id
    title
    handle
    blog {
      handle
    }
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_COLLECTION_FRAGMENT = `#graphql
  fragment PredictiveCollection on Collection {
    __typename
    id
    title
    handle
    image {
      url
      altText
      width
      height
    }
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_PAGE_FRAGMENT = `#graphql
  fragment PredictivePage on Page {
    __typename
    id
    title
    handle
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_PRODUCT_FRAGMENT = `#graphql
  fragment PredictiveProduct on Product {
    __typename
    id
    title
    vendor
    description
    handle
    trackingParameters
    variants(first: 1) {
      nodes {
        id
        sku
        image {
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;
const PREDICTIVE_SEARCH_QUERY_FRAGMENT = `#graphql
  fragment PredictiveQuery on SearchQuerySuggestion {
    __typename
    text
    styledText
    trackingParameters
  }
`;
const PREDICTIVE_SEARCH_QUERY = `#graphql
  query PredictiveSearch(
    $country: CountryCode
    $language: LanguageCode
    $limitScope: PredictiveSearchLimitScope!
    $term: String!
    $types: [PredictiveSearchType!]
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(
      limitScope: $limitScope,
      query: $term,
      types: $types
    ) {
      articles {
        ...PredictiveArticle
      }
      collections {
        ...PredictiveCollection
      }
      pages {
        ...PredictivePage
      }
      products {
        ...PredictiveProduct
      }
      queries {
        ...PredictiveQuery
      }
    }
  }
  ${PREDICTIVE_SEARCH_ARTICLE_FRAGMENT}
  ${PREDICTIVE_SEARCH_COLLECTION_FRAGMENT}
  ${PREDICTIVE_SEARCH_PAGE_FRAGMENT}
  ${PREDICTIVE_SEARCH_PRODUCT_FRAGMENT}
  ${PREDICTIVE_SEARCH_QUERY_FRAGMENT}
`;
async function predictiveSearch({request, context, usePrefix}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const rawTerm = String(url.searchParams.get('q') || '').trim();
  const normalizedTerm = rawTerm.replace(/-/g, ' ');
  const limit = Number(url.searchParams.get('limit') || 10000);
  const type = 'predictive';

  if (!normalizedTerm) {
    return {type, term: '', result: getEmptyPredictiveSearchResult()};
  }

  const terms = normalizedTerm
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);

  const queryTerm = terms
    .map(
      (word) =>
        `(variants.sku:${usePrefix ? word : `*${word}*`} OR title:${
          usePrefix ? word : `*${word}*`
        } OR description:${usePrefix ? word : `*${word}*`})`,
    )
    .join(' AND ');

  const {predictiveSearch: items, errors} = await storefront.query(
    PREDICTIVE_SEARCH_QUERY,
    {
      variables: {
        limit,
        limitScope: 'EACH',
        term: queryTerm,
      },
    },
  );

  if (errors) {
    throw new Error(
      `Shopify API errors: ${errors.map(({message}) => message).join(', ')}`,
    );
  }
  if (!items) {
    throw new Error('No predictive search data returned from Shopify API');
  }

  const total = Object.values(items).reduce((acc, arr) => acc + arr.length, 0);
  return {type, term: normalizedTerm, result: {items, total}};
}

/**
 * @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs
 * @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs
 * @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction
 * @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn
 * @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
 */
