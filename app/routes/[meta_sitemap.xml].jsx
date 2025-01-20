import {flattenConnection} from '@shopify/hydrogen';

export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;

  // Fetch all products to include in your feed
  const products = await fetchAllProducts(storefront);

  // Generate an RSS/XML feed for Meta
  const feedXml = generateMetaXML({products, baseUrl});

  return new Response(feedXml, {
    headers: {
      'Content-Type': 'application/xml',
      // Example caching: 1 hour
      'Cache-Control': `max-age=${60 * 60}`,
    },
  });
}

/**
 * Fetch all products (paginated) from Shopify.
 */
async function fetchAllProducts(storefront) {
  const MAX_PER_PAGE = 250;
  const GLOBAL_MAX = 50000;

  let allProducts = [];
  let afterCursor = null;
  let hasNextPage = true;

  while (hasNextPage && allProducts.length < GLOBAL_MAX) {
    const data = await storefront.query(PRODUCTS_QUERY, {
      variables: {first: MAX_PER_PAGE, after: afterCursor},
    });
    const productsConnection = data?.products;
    if (!productsConnection) break;

    const nodes = flattenConnection(productsConnection);
    allProducts = allProducts.concat(nodes);
    hasNextPage = productsConnection.pageInfo.hasNextPage;
    afterCursor = productsConnection.pageInfo.endCursor;
  }

  return allProducts.slice(0, GLOBAL_MAX);
}

/**
 * Build the Meta-compatible XML feed (RSS 2.0).
 */
function generateMetaXML({products, baseUrl}) {
  // Typically, one <item> per product or variant. This example is one per product.
  return `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Your Store Title</title>
    <link>${baseUrl}</link>
    <description>Your store feed for Meta Catalog</description>
    ${products.map((product) => renderItem(product, baseUrl)).join('')}
  </channel>
</rss>`;
}

/**
 * Render a single <item>. Feel free to expand or loop over variants if needed.
 */
function renderItem(product, baseUrl) {
  const productId = parseGid(product.id) || 'unknown_id';
  const productUrl = `${baseUrl}/products/${xmlEncode(product.handle)}`;
  const title = product.title || 'Untitled Product';
  const description = stripHtml(product.bodyHtml || '');
  const brand = product.vendor || 'MyBrand';
  const primaryImage = product.images?.nodes?.[0]?.url || '';
  const price = product?.variants?.nodes?.[0]?.priceV2;
  const priceAmount = price?.amount || '0.00';
  const priceCurrency = price?.currencyCode || 'USD';
  // Simple availability example. If you want variant-level accuracy, handle that accordingly.
  const inStock = product?.variants?.nodes?.some((v) => v.availableForSale);

  // Additional example fields like shipping, google_product_category, custom_label_0, etc.
  // Customize as your store data allows or as Meta feed requires.

  return `
    <item>
      <g:id>${xmlEncode(productId)}</g:id>
      <g:title>${xmlEncode(title)}</g:title>
      <g:description>${xmlEncode(description)}</g:description>
      <g:link>${xmlEncode(productUrl)}</g:link>
      <g:image_link>${xmlEncode(primaryImage)}</g:image_link>
      <g:brand>${xmlEncode(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${inStock ? 'in stock' : 'out of stock'}</g:availability>
      <g:price>${priceAmount} ${priceCurrency}</g:price>
      <g:shipping>
        <g:country>US</g:country>
        <g:service>Standard</g:service>
        <g:price>5.00 USD</g:price>
      </g:shipping>
      <g:google_product_category>Animals &gt; Pet Supplies</g:google_product_category>
      <g:custom_label_0>Custom Label Data</g:custom_label_0>
    </item>
  `;
}

/**
 * Parse the numeric portion of Shopify's global ID, e.g. 'gid://shopify/Product/12345' => '12345'.
 */
function parseGid(gid) {
  return gid?.split('/')?.pop();
}

/**
 * Remove HTML tags for safe text use in the feed.
 */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, '').trim();
}

/**
 * Encode special characters for XML.
 */
function xmlEncode(string) {
  if (!string) return '';
  return string.replace(/[&<>'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

/**
 * Example GraphQL query fetching:
 *  - Product ID, handle, title, bodyHtml (description), vendor
 *  - Up to 10 images
 *  - Up to 5 variants (expand or paginate if needed)
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
        title
        vendor
        handle
        bodyHtml
        images(first: 10) {
          nodes {
            url
          }
        }
        variants(first: 5) {
          nodes {
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
