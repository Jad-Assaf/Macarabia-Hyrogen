import {flattenConnection} from '@shopify/hydrogen';

/**
 * The main loader for the Merchant Center feed route.
 * @param {import('@shopify/remix-oxygen').LoaderFunctionArgs} args
 */
export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;

  // Fetch all products you want in your feed:
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
      // Adjust caching as desired
      'Cache-Control': `max-age=${60 * 60}`, // 1 hour
    },
  });
}

/**
 * Fetch all pages of data until we hit the limit or no more results.
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

  // Return the limited array if needed
  return allNodes.slice(0, GOOGLE_SITEMAP_LIMIT);
}

/**
 * Generates the RSS feed for Google Merchant Center.
 * Variants are grouped by `item_group_id` (product ID).
 */
function generateMerchantCenterFeed({products, baseUrl}) {
  const allItems = products.flatMap((product) => {
    if (!product?.variants?.nodes?.length) return [];
    return product.variants.nodes.map((variant) => ({
      product,
      variant,
    }));
  });

  return `<?xml version="1.0"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Your Store Title</title>
    <link>${baseUrl}</link>
    <description>Your store feed for Google Merchant Center</description>
    ${allItems
      .map(({product, variant}) =>
        renderProductVariantItem(product, variant, baseUrl),
      )
      .join('')}
  </channel>
</rss>`;
}

/**
 * Render a single <item> entry for each product-variant pair.
 * Includes <g:item_group_id> for grouping variants and <g:id> for the variant's ID.
 */
function renderProductVariantItem(product, variant, baseUrl) {
  const productId = parseGid(product.id); // Product ID for grouping
  const variantId = parseGid(variant.id); // Variant ID for content ID
  const combinedId = `${productId}_${variantId}`; // Unique ID

  const price = variant?.priceV2?.amount || '0.00';
  const currencyCode = variant?.priceV2?.currencyCode || 'USD';
  const brand = product.vendor || 'YourBrand';

  const allImages = product?.images?.nodes || [];
  const firstImageUrl = allImages[0]?.url ? xmlEncode(allImages[0].url) : '';
  const additionalImageTags = allImages
    .slice(1)
    .map((img) => {
      const url = xmlEncode(img.url);
      return `<g:additional_image_link>${url}</g:additional_image_link>`;
    })
    .join('');

  return `
    <item>
      <g:id>${xmlEncode(variantId)}</g:id>
      <g:item_group_id>${xmlEncode(productId)}</g:item_group_id>
      <g:title>${xmlEncode(product.title)}</g:title>
      <g:description>${xmlEncode(product.description || '')}</g:description>
      <g:link>${baseUrl}/products/${xmlEncode(product.handle)}</g:link>
      ${firstImageUrl ? `<g:image_link>${firstImageUrl}</g:image_link>` : ''}
      ${additionalImageTags}
      <g:condition>new</g:condition>
      <g:availability>${
        variant?.availableForSale ? 'in stock' : 'out of stock'
      }</g:availability>
      <g:price>${price} ${currencyCode}</g:price>
      <g:brand>${xmlEncode(brand)}</g:brand>
    </item>
  `;
}

/**
 * Extract the numeric part from the Shopify global ID, or just return the full ID if preferred.
 */
function parseGid(gid) {
  // e.g. 'gid://shopify/Product/1234567890'
  return gid?.split('/').pop();
}

/**
 * Simple XML encoding to avoid issues with special characters.
 */
function xmlEncode(string) {
  return String(string || '').replace(
    /[&<>'"]/g,
    (char) => `&#${char.charCodeAt(0)};`,
  );
}

/**
 * A GraphQL query that fetches:
 *  - The product `id` and `handle`
 *  - `vendor` (optional brand field)
 *  - `description`
 *  - Up to 20 images
 *  - All variants (here, we request up to 100, but can paginate if you have more)
 */
const PRODUCTS_QUERY = `#graphql
  query Products($first: Int!, $after: String) {
    products(first: $first, after: $after, query: "published_status:'online_store:visible'") {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        handle
        title
        description
        vendor
        updatedAt
        images(first: 20) {
          nodes {
            url
            altText
          }
        }
        variants(first: 100) {
          nodes {
            id
            title
            availableForSale
            priceV2 {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;
