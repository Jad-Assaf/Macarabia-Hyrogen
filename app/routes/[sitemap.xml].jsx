import {flattenConnection} from '@shopify/hydrogen';

const MAX_PER_PAGE = 250;

export async function loader({request, context: {storefront}}) {
  const [products, collections, pages] = await Promise.all([
    fetchAllResources(storefront, 'products'),
    fetchAllResources(storefront, 'collections'),
    fetchAllResources(storefront, 'pages'),
  ]);

  if (!products.length && !collections.length && !pages.length) {
    throw new Response('No data found', {status: 404});
  }

  const sitemap = generateSitemap({
    data: {products, collections, pages},
    baseUrl: new URL(request.url).origin,
  });

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': `max-age=${60 * 60 * 24}`,
    },
  });
}

async function fetchAllResources(storefront, resourceType) {
  let hasNextPage = true;
  let cursor = null;
  const allItems = [];

  while (hasNextPage) {
    const data = await storefront.query(PAGINATED_SITEMAP_QUERY, {
      variables: {resourceType, first: MAX_PER_PAGE, after: cursor},
    });

    if (!data || !data[resourceType]) {
      break;
    }

    const connection = flattenConnection(data[resourceType].nodes);
    allItems.push(...connection);

    hasNextPage = data[resourceType].pageInfo.hasNextPage;
    cursor = data[resourceType].pageInfo.endCursor;
  }

  return allItems;
}

function generateSitemap({data, baseUrl}) {
  const products = data.products
    .filter((product) => product.onlineStoreUrl)
    .map((product) => ({
      url: `${baseUrl}/products/${xmlEncode(product.handle)}`,
      lastMod: product.updatedAt,
      changeFreq: 'daily',
      image: product.featuredImage && {
        url: xmlEncode(product.featuredImage.url),
        title: xmlEncode(product.title || ''),
        caption: xmlEncode(product.featuredImage.altText || ''),
      },
    }));

  const collections = data.collections
    .filter((collection) => collection.onlineStoreUrl)
    .map((collection) => ({
      url: `${baseUrl}/collections/${xmlEncode(collection.handle)}`,
      lastMod: collection.updatedAt,
      changeFreq: 'daily',
    }));

  const pages = data.pages
    .filter((page) => page.onlineStoreUrl)
    .map((page) => ({
      url: `${baseUrl}/pages/${xmlEncode(page.handle)}`,
      lastMod: page.updatedAt,
      changeFreq: 'weekly',
    }));

  const urls = [...products, ...collections, ...pages];

  return `
    <urlset
      xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
      xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
    >
      ${urls.map(renderUrlTag).join('')}
    </urlset>`;
}

function xmlEncode(string) {
  return string.replace(/[&<>'"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

function renderUrlTag({url, lastMod, changeFreq, image}) {
  const imageTag = image
    ? `<image:image>
        <image:loc>${image.url}</image:loc>
        <image:title>${image.title}</image:title>
        <image:caption>${image.caption}</image:caption>
      </image:image>`
    : '';

  return `
    <url>
      <loc>${url}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>${changeFreq}</changefreq>
      ${imageTag}
    </url>`;
}

const PAGINATED_SITEMAP_QUERY = `#graphql
  query Sitemap($resourceType: String!, $first: Int, $after: String) {
    products: products(
      first: $first,
      after: $after,
      query: "published_status:'online_store:visible'"
    ) @include(if: $resourceType == "products") {
      nodes {
        updatedAt
        handle
        onlineStoreUrl
        title
        featuredImage {
          url
          altText
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    collections: collections(
      first: $first,
      after: $after,
      query: "published_status:'online_store:visible'"
    ) @include(if: $resourceType == "collections") {
      nodes {
        updatedAt
        handle
        onlineStoreUrl
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
    pages: pages(
      first: $first,
      after: $after,
      query: "published_status:'published'"
    ) @include(if: $resourceType == "pages") {
      nodes {
        updatedAt
        handle
        onlineStoreUrl
      }
      pageInfo {
        hasNextPage
        endCursor
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
