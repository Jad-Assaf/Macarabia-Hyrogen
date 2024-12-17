import {flattenConnection} from '@shopify/hydrogen';
import React from 'react';

const MAX_URLS_PER_PAGE = 250; // Shopify API limit per request
const GOOGLE_SITEMAP_LIMIT = 50000; // Google sitemap limit for URLs

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
      // Always ensure arrays are defined
      products = [];
      collections = [];
      pages = [];
      return {baseUrl, products, collections, pages};
  }

  // Generate and return the correct sitemap
  const sitemap = generateSitemap({
    products: products || [],
    collections: collections || [],
    pages: pages || [],
    baseUrl,
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
     ${sitemap}`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': `max-age=${60 * 60 * 24}`, // Cache for 24 hours
      },
    },
  );
}

/**
 * React-based Styled Sitemap
 */
export default function StyledSitemap({products, collections, pages, baseUrl}) {
  return (
    <div style={{fontFamily: 'Arial, sans-serif', margin: '20px'}}>
      <h1>Sitemap</h1>

      <section>
        <h2>Products</h2>
        <ul>
          {products.map((product) => (
            <li key={product.handle}>
              <a href={`${baseUrl}/products/${product.handle}`}>
                {product.title}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Collections</h2>
        <ul>
          {collections.map((collection) => (
            <li key={collection.handle}>
              <a href={`${baseUrl}/collections/${collection.handle}`}>
                {collection.handle}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Pages</h2>
        <ul>
          {pages.map((page) => (
            <li key={page.handle}>
              <a href={`${baseUrl}/pages/${page.handle}`}>{page.handle}</a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/**
 * Fetch all paginated resources using flattenConnection.
 */
async function fetchAllResources({storefront, query, field}) {
  let allNodes = [];
  let nextPageCursor = null;

  do {
    const response = await storefront.query(query, {
      variables: {
        first: MAX_URLS_PER_PAGE,
        after: nextPageCursor,
      },
    });

    const connection = response?.[field];
    if (!connection) break;

    const nodes = flattenConnection(connection); // Flatten the nodes
    allNodes = allNodes.concat(nodes);

    nextPageCursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (nextPageCursor && allNodes.length < GOOGLE_SITEMAP_LIMIT);

  return allNodes.slice(0, GOOGLE_SITEMAP_LIMIT); // Enforce Google’s limit
}

/**
 * Generate the sitemap XML.
 */
function generateSitemap({products, collections, pages, baseUrl}) {
  const urls = [
    ...products.map((product) => ({
      url: `${baseUrl}/products/${xmlEncode(product.handle)}`,
      lastMod: product.updatedAt,
      changeFreq: 'daily',
      image: product.featuredImage
        ? {
            url: xmlEncode(product.featuredImage.url),
            title: xmlEncode(product.title),
            caption: xmlEncode(product.featuredImage.altText || ''),
          }
        : null,
    })),
    ...collections.map((collection) => ({
      url: `${baseUrl}/collections/${xmlEncode(collection.handle)}`,
      lastMod: collection.updatedAt,
      changeFreq: 'daily',
    })),
    ...pages.map((page) => ({
      url: `${baseUrl}/pages/${xmlEncode(page.handle)}`,
      lastMod: page.updatedAt,
      changeFreq: 'weekly',
    })),
  ];

  return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${urls.map(renderUrlTag).join('\n')}
    </urlset>
  `.trim();
}

function renderUrlTag({url, lastMod, changeFreq, image}) {
  const imageTag = image
    ? `
    <image:image>
      <image:loc>${image.url}</image:loc>
      <image:title>${image.title}</image:title>
      <image:caption>${image.caption}</image:caption>
    </image:image>
  `.trim()
    : '';

  return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>${changeFreq}</changefreq>
      ${imageTag}
    </url>
  `.trim();
}

function xmlEncode(string) {
  return string.replace(/[&<>'"]/g, (char) => `&#${char.charCodeAt(0)};`);
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
