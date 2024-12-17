import {flattenConnection} from '@shopify/hydrogen';

const MAX_URLS_PER_PAGE = 250; // Shopify API limit per request
const GOOGLE_SITEMAP_LIMIT = 50000; // Google sitemap limit for URLs

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;
  const urlPath = new URL(request.url).pathname;

  if (urlPath === '/sitemap-products.xml') {
    const products = await fetchAllResources({
      storefront,
      query: PRODUCTS_QUERY,
      field: 'products',
    });
    const sitemap = generateProductSitemap({products, baseUrl});
    return sendSitemapResponse(sitemap);
  }

  if (urlPath === '/sitemap-collections.xml') {
    const collections = await fetchAllResources({
      storefront,
      query: COLLECTIONS_QUERY,
      field: 'collections',
    });
    const sitemap = generateCollectionSitemap({collections, baseUrl});
    return sendSitemapResponse(sitemap);
  }

  if (urlPath === '/sitemap-pages.xml') {
    const pages = await fetchAllResources({
      storefront,
      query: PAGES_QUERY,
      field: 'pages',
    });
    const sitemap = generatePageSitemap({pages, baseUrl});
    return sendSitemapResponse(sitemap);
  }

  // Main Sitemap referencing the sub-sitemaps
  const sitemap = generateMainSitemap({baseUrl});
  return sendSitemapResponse(sitemap);
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

    const nodes = flattenConnection(connection);
    allNodes = allNodes.concat(nodes);

    nextPageCursor = connection.pageInfo.hasNextPage
      ? connection.pageInfo.endCursor
      : null;
  } while (nextPageCursor && allNodes.length < GOOGLE_SITEMAP_LIMIT);

  return allNodes.slice(0, GOOGLE_SITEMAP_LIMIT);
}

/**
 * Generate the main sitemap referencing all sub-sitemaps.
 */
function generateMainSitemap({baseUrl}) {
  const urls = [
    {loc: `${baseUrl}/sitemap-products.xml`, lastMod: new Date().toISOString()},
    {
      loc: `${baseUrl}/sitemap-collections.xml`,
      lastMod: new Date().toISOString(),
    },
    {loc: `${baseUrl}/sitemap-pages.xml`, lastMod: new Date().toISOString()},
  ];

  return `
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls
        .map(
          ({loc, lastMod}) => `
        <sitemap>
          <loc>${loc}</loc>
          <lastmod>${lastMod}</lastmod>
        </sitemap>
      `,
        )
        .join('')}
    </sitemapindex>
  `.trim();
}

/**
 * Generate the product-specific sitemap.
 */
function generateProductSitemap({products, baseUrl}) {
  return `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${products
        .map(
          (product) => `
        <url>
          <loc>${baseUrl}/products/${xmlEncode(product.handle)}</loc>
          <lastmod>${product.updatedAt}</lastmod>
          ${
            product.featuredImage
              ? `
            <image:image>
              <image:loc>${xmlEncode(product.featuredImage.url)}</image:loc>
              <image:title>${xmlEncode(product.title)}</image:title>
              <image:caption>${xmlEncode(
                product.featuredImage.altText || '',
              )}</image:caption>
            </image:image>`
              : ''
          }
        </url>
      `,
        )
        .join('')}
    </urlset>
  `.trim();
}

/**
 * Generate the collection-specific sitemap.
 */
function generateCollectionSitemap({collections, baseUrl}) {
  return `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${collections
        .map(
          (collection) => `
        <url>
          <loc>${baseUrl}/collections/${xmlEncode(collection.handle)}</loc>
          <lastmod>${collection.updatedAt}</lastmod>
        </url>
      `,
        )
        .join('')}
    </urlset>
  `.trim();
}

/**
 * Generate the page-specific sitemap.
 */
function generatePageSitemap({pages, baseUrl}) {
  return `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${pages
        .map(
          (page) => `
        <url>
          <loc>${baseUrl}/pages/${xmlEncode(page.handle)}</loc>
          <lastmod>${page.updatedAt}</lastmod>
        </url>
      `,
        )
        .join('')}
    </urlset>
  `.trim();
}

/**
 * Utility to send sitemap response.
 */
function sendSitemapResponse(sitemap) {
  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`, // Cache for 24 hours
    },
  });
}

/**
 * XML-safe encoding for strings.
 */
function xmlEncode(string) {
  return string.replace(/[&<>'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

// GraphQL Queries
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo { hasNextPage, endCursor }
      nodes { handle, updatedAt, title, featuredImage { url, altText } }
    }
  }
`;

const COLLECTIONS_QUERY = `#graphql
  query Collections($first: Int!, $after: String) {
    collections(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo { hasNextPage, endCursor }
      nodes { handle, updatedAt }
    }
  }
`;

const PAGES_QUERY = `#graphql
  query Pages($first: Int!, $after: String) {
    pages(first: $first, after: $after, query: "published_status:'published'") {
      pageInfo { hasNextPage, endCursor }
      nodes { handle, updatedAt }
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
