// New Route for Merchant Center Sitemap
export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;

  // Fetch all products for Merchant Center
  const products = await fetchAllResources({
    storefront,
    query: MERCHANT_PRODUCTS_QUERY,
    field: 'products',
  });

  // Generate the Merchant Center sitemap
  const sitemap = generateMerchantSitemap({products, baseUrl});

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`, // Cache for 24 hours
    },
  });
}

/**
 * GraphQL Query for Merchant Center Products
 */
const MERCHANT_PRODUCTS_QUERY = `#graphql
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
        }
        variants(first: 1) {
          nodes {
            price {
              amount
              currencyCode
            }
            inventoryQuantity
          }
        }
      }
    }
  }
`;

/**
 * Generate Merchant Center XML Sitemap
 */
function generateMerchantSitemap({products, baseUrl}) {
  const urls = products.map((product) => {
    const variant = product.variants?.nodes?.[0]; // Use the first variant for simplicity
    return `
      <item>
        <g:id>${xmlEncode(product.handle)}</g:id>
        <g:title>${xmlEncode(product.title)}</g:title>
        <g:link>${baseUrl}/products/${xmlEncode(product.handle)}</g:link>
        <g:image_link>${
          product.featuredImage ? xmlEncode(product.featuredImage.url) : ''
        }</g:image_link>
        <g:price>${
          variant ? `${variant.price.amount} ${variant.price.currencyCode}` : ''
        }</g:price>
        <g:availability>${
          variant?.inventoryQuantity > 0 ? 'in stock' : 'out of stock'
        }</g:availability>
      </item>
    `.trim();
  });

  return `
    <?xml version="1.0" encoding="UTF-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
      <channel>
        <title>Merchant Center Products</title>
        <link>${baseUrl}</link>
        <description>Merchant Center Product Sitemap</description>
        ${urls.join('\n')}
      </channel>
    </rss>
  `.trim();
}

/**
 * Fetch all resources for Merchant Center
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
 * XML-safe encoding for strings
 */
function xmlEncode(string) {
  return string.replace(/[&<>'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}
