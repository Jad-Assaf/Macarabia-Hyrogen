import {flattenConnection} from '@shopify/hydrogen';

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
      // Default: Main sitemap linking to all other sitemaps
      return new Response(generateMainSitemap({baseUrl}), {
        headers: {'Content-Type': 'application/xml'},
      });
  }

  // Generate and return the correct sitemap
  const sitemap = generateSitemap({products, collections, pages, baseUrl});

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`, // Cache for 24 hours
    },
  });
}

const INLINE_XSL = `
<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <html>
      <head>
        <title>Styled Sitemap</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            line-height: 1.6;
          }
          h1 {
            color: #333;
          }
          a {
            color: #0066cc;
            text-decoration: none;
          }
          a:hover {
            text-decoration: underline;
          }
          ul {
            list-style-type: none;
            padding: 0;
          }
          li {
            margin: 10px 0;
          }
        </style>
      </head>
      <body>
        <h1>XML Sitemap</h1>
        <ul>
          <xsl:for-each select="//url">
            <li>
              <a href="{loc}">
                <xsl:value-of select="loc" />
              </a>
              <small>(Last Modified: <xsl:value-of select="lastmod" />)</small>
            </li>
          </xsl:for-each>
        </ul>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
`.trim();

/**
 * Generate the main sitemap linking to other sitemaps.
 */
function generateMainSitemap({baseUrl}) {
  const sitemaps = [
    {url: `${baseUrl}/sitemap-products.xml`, lastMod: new Date().toISOString()},
    {
      url: `${baseUrl}/sitemap-collections.xml`,
      lastMod: new Date().toISOString(),
    },
    {url: `${baseUrl}/sitemap-pages.xml`, lastMod: new Date().toISOString()},
  ];

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="data:text/xsl;base64,${Buffer.from(
      INLINE_XSL,
    ).toString('base64')}"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${sitemaps
        .map(({url, lastMod}) =>
          `
          <url>
            <loc>${url}</loc>
            <lastmod>${lastMod}</lastmod>
          </url>
        `.trim(),
        )
        .join('\n')}
    </urlset>
  `.trim();
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
    <?xml version="1.0" encoding="UTF-8"?>
    <?xml-stylesheet type="text/xsl" href="data:text/xsl;base64,${Buffer.from(
      INLINE_XSL,
    ).toString('base64')}"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls.map(renderUrlTag).join('\n')}
    </urlset>
  `.trim();
}

/**
 * Render a single URL tag for the sitemap.
 */
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
