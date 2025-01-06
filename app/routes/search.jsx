import {json} from '@shopify/remix-oxygen';
import {useLoaderData, useSearchParams, useNavigate} from '@remix-run/react';
import {useState} from 'react';
import {ProductItem} from '~/components/CollectionDisplay';
import {getEmptyPredictiveSearchResult} from '~/lib/search';
import '../styles/SearchPage.css';

/* ------------------------------------------------------------------
   1) MAIN SEARCH ROUTE
------------------------------------------------------------------- */
export async function loader({request, context}) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;

  // Check if we want predictive search (used in your search bar)
  const isPredictive = searchParams.has('predictive');
  if (isPredictive) {
    // Perform predictive search, then return
    const result = await predictiveSearch({request, context}).catch((error) => {
      console.error('Predictive Search Error:', error);
      return {type: 'predictive', term: '', result: null, error: error.message};
    });

    return json({
      ...result,
      // Minimal response—predictive search typically doesn't need
      // the rest of the pagination data
      vendors: [],
      productTypes: [],
      pageInfo: {},
      currentPage: 1,
      totalPages: 1,
    });
  }

  const pageFromQuery = parseInt(searchParams.get('page') || '1', 10);
  const currentPage =
    isNaN(pageFromQuery) || pageFromQuery < 1 ? 1 : pageFromQuery;

  /**
   * STEP A) Build filters: handle vendor => `vendor:"..."`, productType => `product_type:"..."`.
   * We'll detect the requested filterKey and map them to Shopify fields accordingly.
   */
  const shopifyFilterKeyMap = {
    vendor: 'vendor',
    productType: 'product_type',
    // More if needed...
  };

  // Collect the filter values
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

  // Prepare the text-based query filter
  const filterQueryParts = [];
  for (const [rawKey, values] of filterMap.entries()) {
    const shopifyKey = shopifyFilterKeyMap[rawKey] || rawKey;

    if (values.length === 1) {
      // single value => vendor:"Nike"
      filterQueryParts.push(`${shopifyKey}:"${values[0]}"`);
    } else {
      // multiple => (vendor:"Nike" OR vendor:"Adidas")
      const orGroup = values.map((v) => `${shopifyKey}:"${v}"`).join(' OR ');
      filterQueryParts.push(`(${orGroup})`);
    }
  }

  // Add optional term, minPrice, maxPrice
  const term = searchParams.get('q') || '';
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');

  if (minPrice) {
    filterQueryParts.push(`variants.price:>${minPrice}`);
  }
  if (maxPrice) {
    filterQueryParts.push(`variants.price:<${maxPrice}`);
  }

  let filterQuery = term.trim();
  if (filterQueryParts.length > 0) {
    if (filterQuery) {
      filterQuery += ' AND ' + filterQueryParts.join(' AND ');
    } else {
      filterQuery = filterQueryParts.join(' AND ');
    }
  }

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

  /**
   * STEP B) We do 2 fetches:
   *    1) fetchAllEdges() *without* any filter query for building the full list
   *       of all possible vendors/productTypes in the store.
   *    2) fetchAllEdges() *with* the user's filterQuery for the actual results.
   */
  const [unfilteredAllEdges, filteredEdges] = await Promise.all([
    fetchAllEdges({
      storefront: context.storefront,
      filterQuery: '', // no filter => entire store
      sortKey: 'RELEVANCE',
      reverse: false,
    }),
    fetchAllEdges({
      storefront: context.storefront,
      filterQuery,
      sortKey,
      reverse,
    }),
  ]);

  // Gather vendor & productType from unfilteredAllEdges
  const allVendors = [
    ...new Set(unfilteredAllEdges.map(({node}) => node.vendor).filter(Boolean)),
  ].sort();
  const allProductTypes = [
    ...new Set(
      unfilteredAllEdges.map(({node}) => node.productType).filter(Boolean),
    ),
  ].sort();

  const totalProducts = filteredEdges.length;
  const pageSize = 24;
  const totalPages = Math.ceil(totalProducts / pageSize);

  // If 0 results
  if (totalProducts === 0) {
    return json({
      type: 'regular',
      term: filterQuery,
      result: {products: {edges: []}, total: 0},
      vendors: allVendors,
      productTypes: allProductTypes,
      pageInfo: {},
      currentPage: 1,
      totalPages: 1,
    });
  }

  // Clamp currentPage
  const safeCurrentPage =
    currentPage > totalPages ? totalPages : currentPage < 1 ? 1 : currentPage;

  // Build an array of cursors from the filteredEdges
  const pageCursors = computePageCursors(filteredEdges, pageSize);
  const afterCursor = pageCursors[safeCurrentPage];

  // Now fetch only the subset for this page
  const finalResult = await regularSearch({
    context,
    filterQuery,
    sortKey,
    reverse,
    after: afterCursor,
    first: pageSize,
  }).catch((error) => {
    console.error('Search Error:', error);
    return {type: 'regular', term: '', result: null, error: error.message};
  });

  return json({
    ...finalResult,
    vendors: allVendors,
    productTypes: allProductTypes,
    currentPage: safeCurrentPage,
    totalPages,
  });
}

/* ------------------------------------------------------------------
   2) REACT COMPONENT
------------------------------------------------------------------- */
export default function SearchPage() {
  const {
    type,
    term,
    result,
    vendors = [],
    productTypes = [],
    error,
    currentPage = 1,
    totalPages = 1,
  } = useLoaderData();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Price Range States
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  // Desktop collapsibles
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
    // Reset page to 1
    params.delete('page');
    navigate(`/search?${params.toString()}`);
  };

  const handleSortChange = (e) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', e.target.value);
    // Reset page to 1
    params.delete('page');
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

    // Reset page to 1
    params.delete('page');
    navigate(`/search?${params.toString()}`);
  };

  /* -----------------------
     NEXT / PREV ONLY
  ------------------------*/
  const goToPage = (pageNumber) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(pageNumber));
    navigate(`/search?${params.toString()}`);
  };

  // We only show the "previous" button if currentPage > 1
  const hasPrev = currentPage > 1;
  // We only show the "next" button if currentPage < totalPages
  const hasNext = currentPage < totalPages;

  return (
    <div className="search">
      <h1>Search Results</h1>

      <div className="search-filters-container" style={{display: 'flex'}}>
        {/* ------------- SIDEBAR FILTERS ------------- */}
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

        {/* ------------- MAIN SEARCH RESULTS ------------- */}
        {result?.products?.edges?.length > 0 ? (
          <div className="search-results">
            {/* Sort UI */}
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

            {/* Grid of Products */}
            <div className="search-results-grid">
              {result.products.edges.map(({node: product}, index) => (
                <ProductItem product={product} index={index} key={product.id} />
              ))}
            </div>

            {/* PREV / NEXT ONLY */}
            {totalPages > 1 && (
              <div
                style={{
                  marginTop: '1rem',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hasPrev && (
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    aria-label="Previous Page"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {/* Left Arrow SVG */}
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                    <span style={{marginLeft: 5}}>Prev</span>
                  </button>
                )}

                {hasNext && (
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    aria-label="Next Page"
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{marginRight: 5}}>Next</span>
                    {/* Right Arrow SVG */}
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <p>No results found</p>
        )}
      </div>

      {/* ------------- MOBILE FILTERS ------------- */}
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

            {/* Mobile Vendor Filter */}
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

            {/* Mobile Product Type Filter */}
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

            {/* Mobile Price Range Filter */}
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
   3) FETCH ALL PRODUCT EDGES
------------------------------------------------------------------- */
async function fetchAllEdges({storefront, filterQuery, sortKey, reverse}) {
  let allEdges = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    // Request up to 250 at a time
    const res = await storefront.query(MINIMAL_FILTER_QUERY, {
      variables: {
        filterQuery,
        sortKey,
        reverse,
        first: 50,
        after: cursor,
      },
    });

    const {products} = res;
    if (!products?.edges?.length) break;

    allEdges.push(...products.edges);
    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;
  }

  return allEdges;
}

const MINIMAL_FILTER_QUERY = `#graphql
  query AllProductsForCount(
    $filterQuery: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $first: Int
    $after: String
  ) {
    products(
      query: $filterQuery
      sortKey: $sortKey
      reverse: $reverse
      first: $first
      after: $after
    ) {
      edges {
        cursor
        node {
          id
          vendor
          productType
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

/* ------------------------------------------------------------------
   4) COMPUTE PAGE CURSORS
------------------------------------------------------------------- */
function computePageCursors(allEdges, pageSize) {
  if (!allEdges.length) return [null];

  const total = allEdges.length;
  const totalPages = Math.ceil(total / pageSize);
  const pageCursors = [];
  pageCursors[1] = null; // page 1 => no "after" needed

  for (let page = 2; page <= totalPages; page++) {
    // The last item on the previous page is at index ((page - 1) * pageSize) - 1
    const edgeIndex = (page - 1) * pageSize - 1;
    if (edgeIndex < allEdges.length) {
      pageCursors[page] = allEdges[edgeIndex].cursor;
    }
  }

  return pageCursors;
}

/* ------------------------------------------------------------------
   5) REGULAR SEARCH: fetch the current page's subset
------------------------------------------------------------------- */
async function regularSearch({
  context,
  filterQuery,
  sortKey,
  reverse,
  after,
  first,
}) {
  const {storefront} = context;
  try {
    const {products} = await storefront.query(FILTERED_PRODUCTS_QUERY, {
      variables: {filterQuery, sortKey, reverse, after, first},
    });

    if (!products?.edges) {
      return {
        type: 'regular',
        term: filterQuery,
        result: {products: {edges: []}, total: 0},
      };
    }

    return {
      type: 'regular',
      term: filterQuery,
      result: {
        products,
        total: products.edges.length,
      },
    };
  } catch (err) {
    console.error('Error during regular search:', err);
    return {
      type: 'regular',
      term: filterQuery,
      result: null,
      error: err.message,
    };
  }
}

const FILTERED_PRODUCTS_QUERY = `#graphql
  query FilteredProducts(
    $filterQuery: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $after: String
    $first: Int
  ) {
    products(
      query: $filterQuery
      sortKey: $sortKey
      reverse: $reverse
      first: $first
      after: $after
    ) {
      edges {
        cursor
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
        endCursor
      }
    }
  }
`;

/* ------------------------------------------------------------------
   6) PREDICTIVE SEARCH (unchanged)
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

async function predictiveSearch({request, context}) {
  const {storefront} = context;
  const url = new URL(request.url);
  const term = String(url.searchParams.get('q') || '').trim();
  const limit = Number(url.searchParams.get('limit') || 10000);
  const type = 'predictive';

  if (!term) return {type, term, result: getEmptyPredictiveSearchResult()};

  // Break the search term into individual words
  const terms = term
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  // Construct a flexible query that matches SKU, title, or description
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

  const total = Object.values(items).reduce(
    (acc, itemArray) => acc + itemArray.length,
    0,
  );

  return {type, term, result: {items, total}};
}

/**
 * @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs
 * @typedef {import('@shopify/remix-oxygen').ActionFunctionArgs} ActionFunctionArgs
 * @template T @typedef {import('@remix-run/react').MetaFunction<T>} MetaFunction
 * @typedef {import('~/lib/search').RegularSearchReturn} RegularSearchReturn
 * @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn
 * @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData
 */
