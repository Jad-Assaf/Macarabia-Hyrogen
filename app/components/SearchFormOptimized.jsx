import {useFetcher} from '@remix-run/react';
import React, {useRef, useEffect, useState} from 'react';
import {
  getEmptyPredictiveSearchResult,
  urlWithTrackingParams,
} from '~/lib/search';
import {useAside} from './Aside';
import {trackSearch} from '~/lib/metaPixelEvents';

// NEW: Use your optimized search endpoint
export const SEARCH_ENDPOINT = '/search-test';

// A custom debounce hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

/**
 * Component that renders predictive search results using the optimized search.
 * This component provides the same API as your original PredictiveSearchForm.
 *
 * Usage:
 *  <SearchFormOptimized className="header-search">
 *    {({inputRef, fetchResults, goToSearch, fetcher}) => { ...same HTML structure... }}
 *  </SearchFormOptimized>
 */
export function SearchFormOptimized({children, className}) {
  const aside = useAside();
  const fetcher = useFetcher({key: 'optimizedSearch'});
  const term = useRef('');
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  // Use a debounced version of the query so that API calls are delayed
  const debouncedQuery = useDebounce(query, 300);

  // When debouncedQuery changes (and is not empty), submit it to the optimized search endpoint.
  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      term.current = debouncedQuery;
      fetcher.submit(
        {q: debouncedQuery},
        {method: 'get', action: SEARCH_ENDPOINT},
      );
    }
  }, [debouncedQuery]);

  // When the input changes, update local state (do not call fetch immediately)
  function fetchResults(e) {
    setQuery(e.target.value);
  }

  // Called when the user presses Enter or clicks Search.
  function goToSearch() {
    if (inputRef.current) {
      const rawTerm = inputRef.current.value.trim();
      if (rawTerm) {
        trackSearch(rawTerm);
        // Do NOT replace spaces with hyphens; preserve the original query.
        window.location.href = `${SEARCH_ENDPOINT}?q=${encodeURIComponent(
          rawTerm,
        )}`;
      }
    }
  }

  // Update term when the fetcher is loading (for instant results display)
  useEffect(() => {
    if (fetcher.state === 'loading') {
      term.current = String(fetcher.formData?.get('q') || '');
    }
  }, [fetcher.state]);

  return children({
    inputRef,
    fetchResults,
    goToSearch,
    fetcher,
  });
}

/**
 * The hook below is similar to the original usePredictiveSearch hook,
 * but uses our optimized fetcher.
 */
export function useOptimizedPredictiveSearch() {
  const fetcher = useFetcher({key: 'optimizedSearch'});
  const term = useRef('');
  const inputRef = useRef(null);

  if (fetcher?.state === 'loading') {
    term.current = String(fetcher.formData?.get('q') || '');
  }

  useEffect(() => {
    if (!inputRef.current) {
      inputRef.current = document.querySelector('input[type="search"]');
    }
  }, []);

  const {items, total} =
    fetcher?.data?.result ?? getEmptyPredictiveSearchResult();

  return {items, total, inputRef, term, fetcher};
}

/**
 * The following sub-components remain unchanged so that your HTML structure and class names
 * are exactly the same as in your original PredictiveSearchForm.
 */

function truncateText(text, maxLength) {
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

export function SearchResultsOptimized({children}) {
  const aside = useAside();
  const {term, inputRef, fetcher, total, items} =
    useOptimizedPredictiveSearch();

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.blur();
      inputRef.current.value = '';
    }
  }

  function closeSearch() {
    resetInput();
    aside.close();
  }

  return children({
    items,
    closeSearch,
    inputRef,
    state: fetcher.state,
    term,
    total,
  });
}

SearchResultsOptimized.Articles = SearchResultsOptimizedArticles;
SearchResultsOptimized.Collections = SearchResultsOptimizedCollections;
SearchResultsOptimized.Pages = SearchResultsOptimizedPages;
SearchResultsOptimized.Products = SearchResultsOptimizedProducts;
SearchResultsOptimized.Queries = SearchResultsOptimizedQueries;
SearchResultsOptimized.Empty = SearchResultsOptimizedEmpty;

function SearchResultsOptimizedArticles({term, articles, closeSearch}) {
  if (!articles.length) return null;
  return (
    <div className="predictive-search-result" key="articles">
      <h5>Articles</h5>
      <ul>
        {articles.map((article) => {
          const articleUrl = urlWithTrackingParams({
            baseUrl: `/blogs/${article.blog.handle}/${article.handle}`,
            trackingParams: article.trackingParameters,
            term: term.current ?? '',
          });
          return (
            <li className="predictive-search-result-item" key={article.id}>
              <Link onClick={closeSearch} to={articleUrl}>
                {article.image?.url && (
                  <Image
                    alt={article.image.altText ?? ''}
                    src={article.image.url}
                    width={50}
                    height={50}
                  />
                )}
                <div>
                  <span>{article.title}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsOptimizedCollections({term, collections, closeSearch}) {
  if (!collections.length) return null;
  return (
    <div className="predictive-search-result" key="collections">
      <h5>Collections</h5>
      <ul>
        {collections.map((collection) => {
          const colllectionUrl = urlWithTrackingParams({
            baseUrl: `/collections/${collection.handle}`,
            trackingParams: collection.trackingParameters,
            term: term.current,
          });
          return (
            <li className="predictive-search-result-item" key={collection.id}>
              <Link onClick={closeSearch} to={colllectionUrl}>
                {collection.image?.url && (
                  <Image
                    alt={collection.image.altText ?? ''}
                    src={collection.image.url}
                    width={50}
                    height={50}
                  />
                )}
                <div>
                  <span>{collection.title}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsOptimizedPages({term, pages, closeSearch}) {
  if (!pages.length) return null;
  return (
    <div className="predictive-search-result" key="pages">
      <h5>Pages</h5>
      <ul>
        {pages.map((page) => {
          const pageUrl = urlWithTrackingParams({
            baseUrl: `/pages/${page.handle}`,
            trackingParams: page.trackingParameters,
            term: term.current,
          });
          return (
            <li className="predictive-search-result-item" key={page.id}>
              <Link onClick={closeSearch} to={pageUrl}>
                <div>
                  <span>{page.title}</span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsOptimizedProducts({term, products, closeSearch}) {
  if (!products.length) return null;
  return (
    <div className="predictive-search-result" key="products">
      <h5>Products</h5>
      <ul>
        {products.map((product) => {
          const productUrl = `/products/${encodeURIComponent(product.handle)}`;
          const variant = product?.variants?.nodes?.[0] || {};
          const image = variant.image;
          const price = variant.price ?? '0';
          const parsedPrice = parseFloat(price);
          return (
            <li className="predictive-search-result-item" key={product.id}>
              <Link to={productUrl} onClick={closeSearch}>
                {image && (
                  <Image
                    alt={image.altText ?? ''}
                    src={image.url}
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
                    <p className="search-result-description">
                      SKU: {variant.sku}
                    </p>
                  </div>
                  <small className="search-result-price">
                    {parsedPrice === 0 ? (
                      'Call for Price!'
                    ) : (
                      <>
                        <Money data={price} />
                        {variant.compareAtPrice && (
                          <span className="search-result-compare-price">
                            <Money data={variant.compareAtPrice} />
                          </span>
                        )}
                      </>
                    )}
                  </small>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function SearchResultsOptimizedQueries({queries, queriesDatalistId}) {
  if (!queries.length) return null;
  return (
    <datalist id={queriesDatalistId}>
      {queries.map((suggestion) => {
        if (!suggestion) return null;
        return <option key={suggestion.text} value={suggestion.text} />;
      })}
    </datalist>
  );
}

function SearchResultsOptimizedEmpty({term}) {
  if (!term.current) {
    return null;
  }
  return (
    <p className="no-results">
      No results found for <q>{term.current}</q>
    </p>
  );
}

/** @typedef {import('@remix-run/react').Fetcher} Fetcher */
/** @typedef {import('~/lib/search').PredictiveSearchReturn} PredictiveSearchReturn */
