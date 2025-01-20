import {flattenConnection} from '@shopify/hydrogen';

/**
 * The main loader for the Merchant Center feed route.
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;

  // Fetch all products (or only those you want in Merchant Center).
  // You could further refine the GraphQL query to fetch only specific products if needed.
  const products = await fetchAllResources({
    storefront,
    query: PRODUCTS_QUERY,
    field: 'products',
  });

  // Generate the Merchant Center feed (RSS)
  const feedXml = generateMerchantCenterFeed({products, baseUrl});

  return new Response(feedXml, {
    headers: {
      'Content-Type': 'application/xml',
      // Decide on your own cache strategy
      'Cache-Control': `max-age=${60 * 60}`, // e.g., 1 hour
    },
  });
}

/**
 * Fetches paginated data just like in your main sitemap loader.
 */
async function fetchAllResources({storefront, query, field}) {
  const MAX_URLS_PER_PAGE = 250;
  const GOOGLE_SITEMAP_LIMIT = 50000;

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
 * Generates the RSS feed for Google Merchant Center.
 */
function generateMerchantCenterFeed({products, baseUrl}) {
  // Customize <title>, <description>, and store branding as needed
  return `<?xml version="1.0"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Your Store Title</title>
    <link>${baseUrl}</link>
    <description>Your store feed for Google Merchant Center</description>
    ${products.map((product) => renderProductItem(product, baseUrl)).join('')}
  </channel>
</rss>`;
}

/**
 * Render a single <item> entry for each product.
 * Customize fields as needed:
 *  - g:availability
 *  - g:price (use real variant prices)
 *  - g:condition
 *  - g:brand
 *  - etc.
 */
function renderProductItem(product, baseUrl) {
  // Example: using the first variant for price and possibly for availability
  // Adjust to your logic (e.g., pick default variant).
  const variant = product?.variants?.nodes?.[0];
  const price = variant?.priceV2?.amount || '0.00';
  const currencyCode = variant?.priceV2?.currencyCode || 'USD';

  // Demo brand fallback. If you have vendor or brand fields, use them.
  const brand = product.vendor || 'YourBrand';

  return `
    <item>
      <g:id>${xmlEncode(product.handle)}</g:id>
      <g:title>${xmlEncode(product.title)}</g:title>
      <g:description>${xmlEncode(product?.description || '')}</g:description>
      <g:link>${baseUrl}/products/${xmlEncode(product.handle)}</g:link>
      ${
        product.featuredImage
          ? `<g:image_link>${xmlEncode(
              product.featuredImage.url,
            )}</g:image_link>`
          : ''
      }
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price} ${currencyCode}</g:price>
      <g:brand>${xmlEncode(brand)}</g:brand>
    </item>
  `;
}

/**
 * Simple XML encoding to avoid breaking tags with special chars.
 */
function xmlEncode(string) {
  return String(string || '').replace(
    /[&<>'"]/g,
    (char) => `&#${char.charCodeAt(0)};`,
  );
}

// Include variants in your product query so you can fetch actual pricing, etc.
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        handle
        title
        description
        vendor
        updatedAt
        featuredImage {
          url
          altText
        }
        variants(first: 1) {
          nodes {
            priceV2 {
              amount
              currencyCode
            }
            availableForSale
          }
        }
      }
    }
  }
`;
