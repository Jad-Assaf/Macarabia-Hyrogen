import {flattenConnection} from '@shopify/hydrogen';
import React from 'react';
import ReactDOMServer from 'react-dom/server';

const MAX_URLS_PER_PAGE = 250;
const GOOGLE_SITEMAP_LIMIT = 50000;

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}, params}) {
  const baseUrl = new URL(request.url).origin;

  let products = [];
  let collections = [];
  let pages = [];

  switch (params.type) {
    case 'products':
      products = await fetchAllResources({
        storefront,
        query: PRODUCTS_QUERY,
        field: 'products',
      });
      break;
    case 'collections':
      collections = await fetchAllResources({
        storefront,
        query: COLLECTIONS_QUERY,
        field: 'collections',
      });
      break;
    case 'pages':
      pages = await fetchAllResources({
        storefront,
        query: PAGES_QUERY,
        field: 'pages',
      });
      break;
    default:
      return new Response(generateMainStyledSitemap({baseUrl}), {
        headers: {'Content-Type': 'text/html'},
      });
  }

  // Always render styled HTML sitemap
  const styledHtml = renderStyledSitemap({
    products,
    collections,
    pages,
    baseUrl,
  });
  return new Response(styledHtml, {
    headers: {'Content-Type': 'text/html'},
  });
}

/**
 * React Component: Styled Sitemap
 */
function SitemapPage({urls, title}) {
  return (
    <html>
      <head>
        <title>{title} Sitemap</title>
        <style>
          {`
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #333; }
            a { color: #0066cc; text-decoration: none; }
            a:hover { text-decoration: underline; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; }
          `}
        </style>
      </head>
      <body>
        <h1>{title} Sitemap</h1>
        <ul>
          {urls.map((url) => (
            <li key={url.loc}>
              <a href={url.loc}>{url.loc}</a>
              {url.lastMod && <small> (Last Modified: {url.lastMod})</small>}
            </li>
          ))}
        </ul>
      </body>
    </html>
  );
}

/**
 * Render Styled Sitemap using React Server-Side Rendering.
 */
function renderStyledSitemap({products, collections, pages, baseUrl}) {
  const urls = [
    ...products.map((p) => ({
      loc: `${baseUrl}/products/${p.handle}`,
      lastMod: p.updatedAt,
    })),
    ...collections.map((c) => ({
      loc: `${baseUrl}/collections/${c.handle}`,
      lastMod: c.updatedAt,
    })),
    ...pages.map((pg) => ({
      loc: `${baseUrl}/pages/${pg.handle}`,
      lastMod: pg.updatedAt,
    })),
  ];

  return `<!DOCTYPE html>${ReactDOMServer.renderToString(
    <SitemapPage urls={urls} title="XML Sitemap" />,
  )}`;
}

/**
 * Generate the Main Styled Sitemap linking to other sitemaps.
 */
function generateMainStyledSitemap({baseUrl}) {
  const urls = [
    {loc: `${baseUrl}/sitemap-products.xml`, lastMod: new Date().toISOString()},
    {
      loc: `${baseUrl}/sitemap-collections.xml`,
      lastMod: new Date().toISOString(),
    },
    {loc: `${baseUrl}/sitemap-pages.xml`, lastMod: new Date().toISOString()},
  ];

  return `<!DOCTYPE html>${ReactDOMServer.renderToString(
    <SitemapPage urls={urls} title="Main Sitemap" />,
  )}`;
}

/**
 * Fetch resources with pagination.
 */
async function fetchAllResources({storefront, query, field}) {
  let allNodes = [];
  let nextPageCursor = null;

  do {
    const response = await storefront.query(query, {
      variables: {first: MAX_URLS_PER_PAGE, after: nextPageCursor},
    });
    const connection = response?.[field];
    if (!connection) break;

    allNodes = allNodes.concat(flattenConnection(connection));
    nextPageCursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (nextPageCursor && allNodes.length < GOOGLE_SITEMAP_LIMIT);

  return allNodes.slice(0, GOOGLE_SITEMAP_LIMIT);
}

// GraphQL Queries
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        updatedAt
        title
        featuredImage {
          url
          altText
        }
      }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        updatedAt
      }
    }
  }
`;

const PAGES_QUERY = `#graphql
  query Pages($first: Int!, $after: String) {
    pages(first: $first, after: $after, query: "published_status:'published'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        updatedAt
      }
    }
  }
`;

/**
 * @typedef {{
 *   url: string;
 *   lastMod?: string;
 *   changeFreq?: string;
 *   image?: {
 *     url: string;
 *     title?: string;
 *     caption?: string;
 *   };
 * }} Entry
 */

/** @typedef {import('@shopify/remix-oxygen').LoaderFunctionArgs} LoaderFunctionArgs */
/** @typedef {import('storefrontapi.generated').SitemapQuery} SitemapQuery */
/** @typedef {import('@shopify/remix-oxygen').SerializeFrom<typeof loader>} LoaderReturnData */
