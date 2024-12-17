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
      return serveStyledSitemap({
        title: 'Products Sitemap',
        items: products.map((p) => ({
          loc: `${baseUrl}/products/${p.handle}`,
          lastMod: p.updatedAt,
        })),
        style: PRODUCTS_STYLE,
      });

    case 'collections':
      collections = await fetchAllResources({
        storefront,
        query: COLLECTIONS_QUERY,
        field: 'collections',
      });
      return serveStyledSitemap({
        title: 'Collections Sitemap',
        items: collections.map((c) => ({
          loc: `${baseUrl}/collections/${c.handle}`,
          lastMod: c.updatedAt,
        })),
        style: COLLECTIONS_STYLE,
      });

    case 'pages':
      pages = await fetchAllResources({
        storefront,
        query: PAGES_QUERY,
        field: 'pages',
      });
      return serveStyledSitemap({
        title: 'Pages Sitemap',
        items: pages.map((pg) => ({
          loc: `${baseUrl}/pages/${pg.handle}`,
          lastMod: pg.updatedAt,
        })),
        style: PAGES_STYLE,
      });

    default:
      return serveStyledSitemap({
        title: 'Main Sitemap',
        items: [
          {
            loc: `${baseUrl}/sitemap-products.xml`,
            lastMod: new Date().toISOString(),
          },
          {
            loc: `${baseUrl}/sitemap-collections.xml`,
            lastMod: new Date().toISOString(),
          },
          {
            loc: `${baseUrl}/sitemap-pages.xml`,
            lastMod: new Date().toISOString(),
          },
        ],
        style: MAIN_STYLE,
      });
  }
}

/**
 * React Component: Styled Sitemap
 */
function SitemapPage({title, urls, style}) {
  return (
    <html>
      <head>
        <title>{title}</title>
        <style>{style}</style>
      </head>
      <body>
        <h1>{title}</h1>
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
 * Serve Styled Sitemap with React SSR
 */
function serveStyledSitemap({title, items, style}) {
  const html = ReactDOMServer.renderToString(
    <SitemapPage title={title} urls={items} style={style} />,
  );
  return new Response(`<!DOCTYPE html>${html}`, {
    headers: {'Content-Type': 'text/html'},
  });
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

/**
 * Styling for Each Sitemap
 */
const MAIN_STYLE = `
  body { background: #f9f9f9; color: #333; font-family: Arial; margin: 2rem; }
  h1 { color: #0044cc; text-align: center; }
  a { color: #0044cc; font-weight: bold; }
  ul { list-style: square; }
`;

const PRODUCTS_STYLE = `
  body { background: #e8f5e9; color: #1b5e20; font-family: 'Courier New'; margin: 2rem; }
  h1 { color: #388e3c; text-decoration: underline; }
  a { color: #1b5e20; text-transform: uppercase; }
  li { margin-bottom: 8px; }
`;

const COLLECTIONS_STYLE = `
  body { background: #fff3e0; color: #bf360c; font-family: 'Georgia'; margin: 2rem; }
  h1 { color: #e64a19; text-align: center; font-style: italic; }
  a { color: #bf360c; text-decoration: none; }
  a:hover { text-decoration: underline; }
  li { margin-bottom: 10px; }
`;

const PAGES_STYLE = `
  body { background: #ede7f6; color: #311b92; font-family: 'Verdana'; margin: 2rem; }
  h1 { color: #512da8; text-align: center; }
  a { color: #311b92; text-decoration: underline; }
  li { margin-bottom: 12px; }
`;

/**
 * GraphQL Queries
 */
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
    }
  }
`;

const PAGES_QUERY = `#graphql
  query Pages($first: Int!, $after: String) {
    pages(first: $first, after: $after, query: "published_status:'published'") {
      pageInfo { hasNextPage endCursor }
      nodes { handle updatedAt }
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
