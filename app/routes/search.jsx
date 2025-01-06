import {json} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams, useNavigate} from '@remix-run/react';
import {useState} from 'react';
import '../styles/SearchPage.css';
import {ProductItem} from '~/components/CollectionDisplay';
import {getEmptyPredictiveSearchResult} from '~/lib/search';

/* -----------------------------------------
   MAIN SEARCH ROUTE
------------------------------------------ */

/**
 * @type {import('@remix-run/react').MetaFunction}
 */
export const meta = () => {
  return [{title: `Hydrogen | Search`}];
};

/**
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Check for pagination cursors
  const after = searchParams.get('after') || null; // For "Next" page
  const before = searchParams.get('before') || null; // For "Previous" page

  // Build your filter query, sort options, etc.
  const filterQueryParts = [];
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '');
      filterQueryParts.push(`${filterKey}:${value}`);
    }
  }

  const term = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  // Price conditions
  if (minPrice) {
    filterQueryParts.push(`variants.price:>${minPrice}`);
  }
  if (maxPrice) {
    filterQueryParts.push(`variants.price:<${maxPrice}`);
  }

  const filterQuery = `${term} ${filterQueryParts.join(' AND ')}`;

  // Sorting
  const sortKeyMapping = {
    featured: 'RELEVANCE',
    'price-low-high': 'PRICE',
    'price-high-low': 'PRICE',
    'best-selling': 'BEST_SELLING',
    newest: 'CREATED_AT',
  };
  const reverseMapping = {
    'price-high-low': true,
  };

  const sortKey = sortKeyMapping[searchParams.get('sort')] || 'RELEVANCE';
  const reverse = reverseMapping[searchParams.get('sort')] || false;

  // Predictive or normal search?
  const isPredictive = searchParams.has('predictive');
  const searchPromise = isPredictive
    ? predictiveSearch({request, context})
    : regularSearch({
        request,
        context,
        filterQuery,
        sortKey,
        reverse,
        after,
        before,
      });

  const result = await searchPromise.catch((error) => {
    console.error('Search Error:', error);
    return {term: '', result: null, error: error.message};
  });

  // Grab vendor and productType filters from the results
  const filteredVendors = [
    ...new Set(result?.result?.products?.edges?.map(({node}) => node.vendor)),
  ].sort();

  const filteredProductTypes = [
    ...new Set(
      result?.result?.products?.edges?.map(({node}) => node.productType),
    ),
  ].sort();

  return json({
    ...result,
    vendors: filteredVendors,
    productTypes: filteredProductTypes,
    // We'll pass along pagination info
    pageInfo: result?.result?.products?.pageInfo || {},
  });
}

export default function SearchPage() {
  const {
    type,
    term,
    result,
    vendors = [],
    productTypes = [],
    error,
    pageInfo = {},
  } = useLoaderData();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Local state for price range
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Desktop filters
  const [showVendors, setShowVendors] = useState(false);
  const [showProductTypes, setShowProductTypes] = useState(false);
  const [showPriceRange, setShowPriceRange] = useState(false);

  // Mobile filters
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [mobileShowVendors, setMobileShowVendors] = useState(false);
  const [mobileShowProductTypes, setMobileShowProductTypes] = useState(false);
  const [mobileShowPriceRange, setMobileShowPriceRange] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Close mobile filters
  const closeMobileFilters = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsMobileFiltersOpen(false);
      setIsClosing(false);
    }, 300);
  };

  /* -----------------------
     FILTER CHANGE HANDLERS
  ------------------------*/
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
    // Reset pagination on filter change
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
    // Reset pagination on sort change
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

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
    // Reset pagination on filter change
    params.delete('after');
    params.delete('before');
    navigate(`/search?${params.toString()}`);
  };

  /* -----------------------
     NEXT / PREVIOUS HANDLERS
  ------------------------*/

  // "Next" page: use endCursor with `after=`
  const handleNextPage = () => {
    if (!pageInfo.hasNextPage) return;
    const params = new URLSearchParams(searchParams);
    params.set('after', pageInfo.endCursor);
    params.delete('before'); // remove previous page param
    navigate(`/search?${params.toString()}`);
  };

  // "Previous" page: use startCursor with `before=`
  const handlePreviousPage = () => {
    if (!pageInfo.hasPreviousPage) return;
    const params = new URLSearchParams(searchParams);
    params.set('before', pageInfo.startCursor);
    params.delete('after'); // remove next page param
    navigate(`/search?${params.toString()}`);
  };

  /* -----------------------
     RENDER
  ------------------------*/
  return (
    <div className="search">
      <h1>Search Results</h1>
      <div className="search-filters-container" style={{display: 'flex'}}>
        {/* Sidebar Filters (Desktop) */}
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
                {productTypes.map((productType) => {
                  const isChecked = searchParams
                    .getAll('filter_productType')
                    .includes(productType);
                  return (
                    <div key={productType} className="filter-option">
                      <input
                        type="checkbox"
                        id={`productType-${productType}`}
                        value={productType}
                        checked={isChecked}
                        onChange={(e) =>
                          handleFilterChange(
                            'productType',
                            productType,
                            e.target.checked,
                          )
                        }
                      />
                      <label
                        className="filter-label"
                        htmlFor={`productType-${productType}`}
                      >
                        {productType}
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
        {result?.products?.edges?.length > 0 ? (
          <div className="search-results">
            {/* Sort Dropdown */}
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

            <div className="search-results-grid">
              {result.products.edges.map(({node: product}, index) => (
                <ProductItem product={product} index={index} key={product.id} />
              ))}
            </div>

            {/* Pagination Buttons */}
            <div style={{marginTop: '1rem', display: 'flex', gap: '10px'}}>
              {pageInfo.hasPreviousPage && (
                <button onClick={handlePreviousPage}>Previous Page</button>
              )}
              {pageInfo.hasNextPage && (
                <button onClick={handleNextPage}>Next Page</button>
              )}
            </div>
          </div>
        ) : (
          <p>No results found</p>
        )}
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
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 460.775 460.775"
              >
                <g>
                  <path
                    d="M285.08,230.397L456.218,59.27c6.076-6.077,6.076-15.911,0-21.986L423.511,4.565
                    c-2.913-2.911-6.866-4.55-10.992-4.55c-4.127,0-8.08,1.639-10.993,4.55L285.08,171.705L59.25,4.565
                    c-2.913-2.911-6.866-4.55-10.993-4.55c-4.126,0-8.08,1.639-10.992,4.55L4.558,37.284c-6.077,6.075-6.077,15.909,0,21.986
                    l171.138,171.128L4.575,401.505c-6.074,6.077-6.074,15.911,0,21.986l32.709,32.719c2.911,2.911,6.865,4.55,10.992,4.55
                    c4.127,0,8.08-1.639,10.994-4.55l171.117-171.12l171.118,171.12c2.913,2.911,6.866,4.55,10.993,4.55
                    c4.128,0,8.081-1.639,10.992-4.55l32.709-32.719c6.074-6.075,6.074-15.909,0-21.986L285.08,230.397z"
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
                  {productTypes.map((productType) => {
                    const isChecked = searchParams
                      .getAll('filter_productType')
                      .includes(productType);
                    return (
                      <div key={productType} className="filter-option">
                        <input
                          type="checkbox"
                          id={`mobile-productType-${productType}`}
                          value={productType}
                          checked={isChecked}
                          onChange={(e) =>
                            handleFilterChange(
                              'productType',
                              productType,
                              e.target.checked,
                            )
                          }
                        />
                        <label htmlFor={`mobile-productType-${productType}`}>
                          {productType}
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

/* -----------------------------------------
   FILTERED_PRODUCTS_QUERY with pagination
------------------------------------------ */
const FILTERED_PRODUCTS_QUERY = `
  query FilteredProducts(
    $filterQuery: String!
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $after: String
    $before: String
    $first: Int
    $last: Int
  ) {
    products(
      query: $filterQuery
      sortKey: $sortKey
      reverse: $reverse
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
      edges {
        node {
          vendor
          id
          title
          handle
          productType
          description
          images(first: 3) {
            nodes {
              url
              altText
            }
          }
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          variants(first: 1) {
            nodes {
              id
              sku
              price {
                amount
                currencyCode
              }
              image {
                url
                altText
              }
              availableForSale
              compareAtPrice {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        endCursor
        startCursor
      }
    }
  }
`;

/**
 * Perform a regular (non-predictive) product search.
 * We switch between using `first/after` vs `last/before` depending
 * on which param is provided.
 */
async function regularSearch({
  request,
  context,
  filterQuery,
  sortKey,
  reverse,
  after,
  before,
}) {
  const {storefront} = context;

  try {
    // If "after" is set, we fetch the next page. If "before" is set, we fetch the previous page.
    let first = null;
    let last = null;

    if (after) {
      first = 24; // Page size going forward
    } else if (before) {
      last = 24; // Page size going backward
    } else {
      // Default: if neither is set, we load the first page
      first = 24;
    }

    const variables = {
      filterQuery,
      sortKey,
      reverse,
      after,
      before,
      first,
      last,
    };

    const {products} = await storefront.query(FILTERED_PRODUCTS_QUERY, {
      variables,
    });

    if (!products?.edges) {
      return {term: filterQuery, result: {products: {edges: []}, total: 0}};
    }

    return {
      term: filterQuery,
      result: {
        products,
        total: products.edges.length,
      },
    };
  } catch (error) {
    console.error('Error during regular search:', error);
    return {term: filterQuery, result: null, error: error.message};
  }
}

/* -----------------------------------------
   PREDICTIVE SEARCH STUFF
------------------------------------------ */
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
      types: $types,
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

/**
 * Predictive search: get partial search results for suggestions, etc.
 */
async function predictiveSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10000);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  const terms = term
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  // Flexible search on SKU, title, description
  const queryTerm = terms
    .map(
      (word) =>
        `(variants.sku:*${word}* OR title:*${word}* OR description:*${word}*)`,
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

  return {type, term, result: {items, total}};
}

/**
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
 * @typedef {{
 *   term: string;
 *   result: {
 *     products?: {
 *       edges: any[];
 *       pageInfo?: { hasNextPage: boolean; endCursor: string };
 *     };
 *     total?: number;
 *     items?: any;
 *   } | null;
 *   type?: string;
 *   vendors?: string[];
 *   productTypes?: string[];
 *   error?: string;
 *   pageInfo?: { hasNextPage: boolean; endCursor: string } | null;
 * }} RegularSearchReturn
 *
 * @typedef {{
 *   type: string;
 *   term: string;
 *   result: {
 *     items: any;
 *     total: number;
 *   }
 * }} PredictiveSearchReturn
 */
