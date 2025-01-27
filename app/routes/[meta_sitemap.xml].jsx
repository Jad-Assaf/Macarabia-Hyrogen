import {flattenConnection} from '@shopify/hydrogen';

/**
 * A loader to create an RSS XML feed with each product variant as a separate <item>.
 * Adapt the fields inside `renderProductVariantItem` to fit your needs.
 */
export async function loader({request, context: {storefront}}) {
  const baseUrl = new URL(request.url).origin;

  // 1. Fetch all products/variants
  const products = await fetchAllResources({
    storefront,
    query: PRODUCTS_QUERY,
    field: 'products',
  });

  // 2. Generate the feed (similar structure to your Merchant Center feed)
  const feedXml = generateMetaXmlFeed({products, baseUrl});

  return new Response(feedXml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60}`, // 1 hour cache
    },
  });
}

/**
 * Reusable helper to fetch all paginated data up to the limit.
 */
async function fetchAllResources({storefront, query, field}) {
  const MAX_URLS_PER_PAGE = 250;
  const TOTAL_LIMIT = 50000;

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
  } while (nextPageCursor && allNodes.length < TOTAL_LIMIT);

  return allNodes.slice(0, TOTAL_LIMIT);
}

/**
 * Generates an RSS 2.0 XML feed using <g:> tags (common for Google/Meta).
 * Creates one <item> for each variant.
 */
function generateMetaXmlFeed({products, baseUrl}) {
  // Flatten products into an array of (product, variant) pairs
  const allItems = products.flatMap((product) => {
    if (!product?.variants?.nodes?.length) return [];
    return product.variants.nodes.map((variant) => ({product, variant}));
  });

  return `<?xml version="1.0"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Your Store Title</title>
    <link>${baseUrl}</link>
    <description>Your feed for Meta (or other channels)</description>
    ${allItems
      .map(({product, variant}) =>
        renderProductVariantItem(product, variant, baseUrl),
      )
      .join('')}
  </channel>
</rss>`;
}

/**
 * Renders an individual <item> with whatever fields you need.
 * Compare to your existing merchant feed to see what's different.
 */
function renderProductVariantItem(product, variant, baseUrl) {
  const productId = parseGid(product.id); // Product ID for grouping
  const variantId = parseGid(variant.id); // Variant ID for unique identification

  // Example: price from variant
  const price = variant?.priceV2?.amount || '0.00';
  const currencyCode = variant?.priceV2?.currencyCode || 'USD';

  // Basic brand fallback
  const brand = product.vendor || 'MyBrand';

  // Use the variant image if available; otherwise, fallback to the first product image
  const variantImage = variant?.image?.url || null;
  const fallbackImage = product?.images?.nodes?.[0]?.url || '';
  const imageUrl = xmlEncode(variantImage || fallbackImage);

  // Additional images: exclude the main image (variant or fallback)
  const additionalImageTags =
    product?.images?.nodes
      ?.filter((img) => img.url !== imageUrl) // Exclude the primary image
      ?.map(
        (img) =>
          `<g:additional_image_link>${xmlEncode(
            img.url,
          )}</g:additional_image_link>`,
      )
      .join('') || '';

  // Extract standard variant attributes
  const color =
    variant?.selectedOptions?.find(
      (option) => option.name.toLowerCase() === 'color',
    )?.value || '';
  const size =
    variant?.selectedOptions?.find(
      (option) => option.name.toLowerCase() === 'size',
    )?.value || '';
  const material =
    variant?.selectedOptions?.find(
      (option) => option.name.toLowerCase() === 'material',
    )?.value || '';
  const pattern =
    variant?.selectedOptions?.find(
      (option) => option.name.toLowerCase() === 'pattern',
    )?.value || '';

  // Capture all other custom options as additional_variant_attribute
  const additionalAttributes =
    variant?.selectedOptions
      ?.filter(
        (option) =>
          !['color', 'size', 'material', 'pattern'].includes(
            option.name.toLowerCase(),
          ),
      )
      ?.map(
        (option) =>
          `<g:additional_variant_attribute name="${xmlEncode(
            option.name,
          )}">${xmlEncode(option.value)}</g:additional_variant_attribute>`,
      )
      .join('') || '';

  return `
    <item>
      <g:id>${xmlEncode(variantId)}</g:id>
      <g:item_group_id>${xmlEncode(productId)}</g:item_group_id>
      <g:title>${xmlEncode(product.title)}</g:title>
      <g:description>${xmlEncode(product.description || '')}</g:description>
      <g:link>${baseUrl}/products/${xmlEncode(
    product.handle,
  )}?variant=${xmlEncode(variantId)}</g:link>
      ${imageUrl ? `<g:image_link>${imageUrl}</g:image_link>` : ''}
      ${additionalImageTags}
      <g:brand>${xmlEncode(brand)}</g:brand>
      <g:condition>new</g:condition>
      <g:availability>${
        variant?.availableForSale ? 'in stock' : 'out of stock'
      }</g:availability>
      <g:price>${price} ${currencyCode}</g:price>
      ${color ? `<g:color>${xmlEncode(color)}</g:color>` : ''}
      ${size ? `<g:size>${xmlEncode(size)}</g:size>` : ''}
      ${material ? `<g:material>${xmlEncode(material)}</g:material>` : ''}
      ${pattern ? `<g:pattern>${xmlEncode(pattern)}</g:pattern>` : ''}
      ${additionalAttributes}
      <g:shipping>
        <g:country>LB</g:country>
        <g:service>Standard</g:service>
        <g:price>5.00 USD</g:price>
      </g:shipping>
    </item>
  `;
}

/**
 * Parse numeric ID out of the Shopify global ID (e.g. "gid://shopify/Product/12345" -> "12345").
 */
function parseGid(gid) {
  return gid?.split('/').pop();
}

/**
 * XML-encode special characters.
 */
function xmlEncode(string) {
  return String(string || '').replace(
    /[&<>'"]/g,
    (char) => `&#${char.charCodeAt(0)};`,
  );
}

/**
 * Updated GraphQL query to include image and selectedOptions for each variant.
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
        images(first: 3) {
          nodes {
            url
            altText
          }
        }
        variants(first: 10) {
          nodes {
            id
            title
            availableForSale
            priceV2 {
              amount
              currencyCode
            }
            image {
              url
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
    }
  }
`;
