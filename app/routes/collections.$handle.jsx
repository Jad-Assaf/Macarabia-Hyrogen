import {defer, redirect} from '@shopify/remix-oxygen';
import {
  useLoaderData,
  Link,
  useSearchParams,
  useLocation,
  useNavigate,
} from '@remix-run/react';
import {
  getPaginationVariables,
  Image,
  Money,
  Analytics,
  getSeoMeta,
} from '@shopify/hydrogen';
import React, {useEffect, useRef, useState} from 'react';
import {useVariantUrl} from '~/lib/variants';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {DrawerFilter} from '~/modules/drawer-filter';
import {FILTER_URL_PREFIX} from '~/lib/const';
import {FiltersDrawer} from '../modules/drawer-filter';
import {getAppliedFilterLink} from '../lib/filter';
import {AddToCartButton} from '../components/AddToCartButton';
import {useAside} from '~/components/Aside';
import '../styles/CollectionSlider.css';

function truncateText(text, maxWords) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  const words = text.split(' ');
  return words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '...'
    : text;
}

/**
 * @type {MetaFunction<typeof loader>}
 */
export const meta = ({data}) => {
  const collection = data?.collection;

  return getSeoMeta({
    title: `${collection?.title || 'Collection'} | Macarabia`,
    description: truncateText(
      collection?.description || 'Explore our latest collection at Macarabia.',
      20,
    ),
    url: `https://macarabia.me/collections/${collection?.handle || ''}`,
    image:
      collection?.image?.url ||
      'https://macarabia.me/default-collection-image.jpg',
    jsonLd: [
      // CollectionPage Schema
      {
        '@context': 'http://schema.org/',
        '@type': 'CollectionPage',
        name: collection?.title || 'Collection',
        url: `https://macarabia.me/collections/${collection?.handle || ''}`,
        description: truncateText(collection?.description || '', 20),
        image: {
          '@type': 'ImageObject',
          url:
            collection?.image?.url ||
            'https://macarabia.me/default-collection-image.jpg',
        },
        hasPart: collection?.products?.nodes?.slice(0, 20).map((product) => ({
          '@type': 'Product',
          name: truncateText(product?.title || 'Product', 10),
          url: `https://macarabia.me/products/${encodeURIComponent(
            product?.handle,
          )}`,
          sku: product?.variants?.[0]?.sku || product?.variants?.[0]?.id || '',
          gtin12:
            product?.variants?.[0]?.barcode?.length === 12
              ? product?.variants?.[0]?.barcode
              : undefined,
          gtin13:
            product?.variants?.[0]?.barcode?.length === 13
              ? product?.variants?.[0]?.barcode
              : undefined,
          gtin14:
            product?.variants?.[0]?.barcode?.length === 14
              ? product?.variants?.[0]?.barcode
              : undefined,
          productID: product?.id,
          brand: {
            '@type': 'Brand',
            name: product?.vendor || 'Macarabia',
          },
          description: truncateText(product?.description || '', 20),
          image: `https://macarabia.me/products/${product?.featuredImage?.url}`,
          offers: {
            '@type': 'Offer',
            priceCurrency: product?.variants?.[0]?.price?.currencyCode || 'USD',
            price: product?.variants?.[0]?.price?.amount || '0.00',
            itemCondition: 'http://schema.org/NewCondition',
            availability: product?.availableForSale
              ? 'http://schema.org/InStock'
              : 'http://schema.org/OutOfStock',
            url: `https://macarabia.me/products/${encodeURIComponent(
              product?.handle,
            )}`,
            priceValidUntil: '2025-12-31',
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: {
                '@type': 'MonetaryAmount',
                value: '5.00',
                currency: 'USD',
              },
              shippingDestination: {
                '@type': 'DefinedRegion',
                addressCountry: 'LB',
              },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 0,
                  maxValue: 3,
                  unitCode: 'DAY',
                },
                transitTime: {
                  '@type': 'QuantitativeValue',
                  minValue: 1,
                  maxValue: 5,
                  unitCode: 'DAY',
                },
              },
            },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'LB',
              returnPolicyCategory:
                'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 5,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
            },
          },
        })),
      },
      // BreadcrumbList Schema
      {
        '@context': 'http://schema.org/',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://macarabia.me',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: collection?.title || 'Collection',
            item: `https://macarabia.me/collections/${
              collection?.handle || ''
            }`,
          },
        ],
      },
      // ItemList Schema
      {
        '@context': 'http://schema.org/',
        '@type': 'ItemList',
        name: collection?.title || 'Collection',
        description: truncateText(collection?.description || '', 20),
        url: `https://macarabia.me/collections/${collection?.handle || ''}`,
        itemListElement: collection?.products?.nodes
          ?.slice(0, 20)
          .map((product, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://macarabia.me/products/${encodeURIComponent(
              product?.handle,
            )}`,
            name: truncateText(product?.title || 'Product', 10),
            image: {
              '@type': 'ImageObject',
              url:
                product?.featuredImage?.url ||
                'https://macarabia.me/default-product-image.jpg',
            },
          })),
      },
    ],
  });
};

/**
 * @param {LoaderFunctionArgs} args
 */
export async function loader(args) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return defer({...deferredData, ...criticalData});
}

/**
 * Load data necessary for rendering content above the fold. This is the critical data
 * needed to render the page. If it's unavailable, the whole page should 400 or 500 error.
 * @param {LoaderFunctionArgs}
 */
export async function loadCriticalData({context, params, request}) {
  const {handle} = params;
  const {storefront} = context;
  const searchParams = new URL(request.url).searchParams;
  const paginationVariables = getPaginationVariables(request, {pageBy: 20});

  // Set default sort to 'newest' if no sort parameter is provided
  const sort = searchParams.get('sort') || 'newest';
  let sortKey;
  let reverse = false;

  // Map sort values to Shopify's sortKey and reverse
  switch (sort) {
    case 'price-low-high':
      sortKey = 'PRICE';
      break;
    case 'price-high-low':
      sortKey = 'PRICE';
      reverse = true;
      break;
    case 'best-selling':
      sortKey = 'BEST_SELLING';
      break;
    case 'newest':
      sortKey = 'CREATED';
      reverse = true;
      break;
    case 'featured':
    default:
      sortKey = 'CREATED';
      break;
  }

  // Extract filters from URL
  const filters = [];
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith(FILTER_URL_PREFIX)) {
      const filterKey = key.replace(FILTER_URL_PREFIX, '');
      filters.push({[filterKey]: JSON.parse(value)});
    }
  }

  if (!handle) {
    throw redirect('/collections');
  }

  try {
    // Fetch main collection
    const {collection} = await storefront.query(COLLECTION_QUERY, {
      variables: {
        handle,
        first: 20,
        filters: filters.length ? filters : undefined,
        sortKey,
        reverse,
        ...paginationVariables,
      },
    });

    if (!collection) {
      throw new Response(`Collection ${handle} not found`, {status: 404});
    }

    let menu = null;
    let sliderCollections = [];

    try {
      const menuResult = await storefront.query(MENU_QUERY, {
        variables: {handle},
      });
      menu = menuResult.menu;
    } catch (error) {
      console.error('Error fetching menu:', error);
    }

    if (menu && menu.items && menu.items.length > 0) {
      try {
        sliderCollections = await Promise.all(
          menu.items.map(async (item) => {
            try {
              const sanitizedHandle = sanitizeHandle(item.title);
              const {collection} = await storefront.query(
                COLLECTION_BY_HANDLE_QUERY,
                {
                  variables: {handle: sanitizedHandle},
                },
              );
              return collection;
            } catch (error) {
              console.error(
                `Error fetching collection for ${item.title}:`,
                error,
              );
              return null;
            }
          }),
        );
        sliderCollections = sliderCollections.filter(
          (collection) => collection !== null,
        );
      } catch (error) {
        console.error('Error fetching slider collections:', error);
      }
    }

    // Process applied filters
    const appliedFilters = [];
    searchParams.forEach((value, key) => {
      if (key.startsWith(FILTER_URL_PREFIX)) {
        const filterKey = key.replace(FILTER_URL_PREFIX, '');
        const filterValue = JSON.parse(value);
        appliedFilters.push({
          label: `${value}`,
          filter: {[filterKey]: filterValue},
        });
      }
    });

    // Extend return object with SEO and image data
    return {
      collection,
      appliedFilters,
      sliderCollections,
      seo: {
        title: collection?.seo?.title || `${collection.title} Collection`,
        description:
          collection?.seo?.description || collection.description || '',
        image: collection?.image?.url || null,
      },
    };
  } catch (error) {
    console.error('Error fetching collection:', error);
    throw new Response('Error fetching collection', {status: 500});
  }
}

function sanitizeHandle(handle) {
  return handle
    .toLowerCase()
    .replace(/"/g, '')
    .replace(/&/g, '')
    .replace(/\./g, '-')
    .replace(/\s+/g, '-');
}

/**
 * Load data for rendering content below the fold. This data is deferred and will be
 * fetched after the initial page load. If it's unavailable, the page should still 200.
 * Make sure to not throw any errors here, as it will cause the page to 500.
 * @param {LoaderFunctionArgs}
 */
function loadDeferredData({context}) {
  return {};
}

export default function Collection() {
  const {collection, appliedFilters, sliderCollections} = useLoaderData();
  const [userSelectedNumberInRow, setUserSelectedNumberInRow] = useState(null);

  // Always default to 1 if user hasn't chosen a layout
  function calculateNumberInRow(width, userSelection) {
    if (userSelection !== null) return userSelection;
    return 1;
  }

  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );
  const [numberInRow, setNumberInRow] = useState(
    typeof window !== 'undefined'
      ? calculateNumberInRow(window.innerWidth, userSelectedNumberInRow)
      : 1,
  );

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setNumberInRow(calculateNumberInRow(width, userSelectedNumberInRow));
    };

    updateLayout(); // on mount

    const debounce = (fn, delay) => {
      let timeoutId;
      return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
      };
    };

    const debouncedUpdateLayout = debounce(updateLayout, 100);
    window.addEventListener('resize', debouncedUpdateLayout);
    return () => window.removeEventListener('resize', debouncedUpdateLayout);
  }, [userSelectedNumberInRow]);

  function handleLayoutChange(n) {
    setUserSelectedNumberInRow(n);
    setNumberInRow(n);
  }

  function handleFilterRemove(filter) {
    const newUrl = getAppliedFilterLink(filter, searchParams, location);
    navigate(newUrl);
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.search.includes('?direction')) {
      const cleanUrl = url.origin + url.pathname;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, []);

  // No client-side sorting: just use the collection's product nodes
  const products = collection?.products?.nodes || [];

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      {/* Always render sliderCollections (no isDesktop check) */}
      {sliderCollections && sliderCollections.length > 0 && (
        <div className="slide-con">
          <div className="category-slider">
            {sliderCollections.map(
              (sliderCollection) =>
                sliderCollection && (
                  <Link
                    key={sliderCollection.id}
                    to={`/collections/${sliderCollection.handle}`}
                    className="category-container"
                  >
                    {sliderCollection.image && (
                      <Image
                        srcSet={`${sliderCollection.image.url}?width=300&quality=7 300w,
                                 ${sliderCollection.image.url}?width=600&quality=7 600w,
                                 ${sliderCollection.image.url}?width=1200&quality=7 1200w`}
                        alt={
                          sliderCollection.image.altText ||
                          sliderCollection.title
                        }
                        className="category-image"
                        width={150}
                        height={150}
                        loading="eager"
                      />
                    )}
                    <div className="category-title">
                      {sliderCollection.title}
                    </div>
                  </Link>
                ),
            )}
          </div>
        </div>
      )}

      {/* Always render FiltersDrawer (hide via CSS if small screen) */}
      <div className="w-[220px]">
        <FiltersDrawer
          filters={collection.products.filters}
          appliedFilters={appliedFilters}
          collections={[
            {handle: 'apple', title: 'Apple'},
            {handle: 'gaming', title: 'Gaming'},
            {handle: 'laptops', title: 'Laptops'},
            {handle: 'desktops', title: 'Desktops'},
            {handle: 'pc-parts', title: 'PC Parts'},
            {handle: 'networking', title: 'Networking'},
            {handle: 'monitors', title: 'Monitors'},
            {handle: 'mobiles', title: 'Mobile Phones'},
            {handle: 'tablets', title: 'Tablets'},
            {handle: 'audio', title: 'Audio'},
            {handle: 'accessories', title: 'Accessories'},
            {handle: 'fitness', title: 'Fitness'},
            {handle: 'photography', title: 'Photography'},
            {handle: 'home-appliances', title: 'Home Appliances'},
          ]}
          onRemoveFilter={handleFilterRemove}
        />
      </div>

      <div className="flex-1 mt-[94px]">
        <hr className="col-hr" />

        <div className="view-container">
          <div className="layout-controls">
            <span className="number-sort">View As:</span>
            {/* Example layout toggles */}
            <button
              className={`layout-buttons ${numberInRow === 1 ? 'active' : ''}`}
              onClick={() => handleLayoutChange(1)}
            >
              1
            </button>
            <button
              className={`layout-buttons ${numberInRow === 2 ? 'active' : ''}`}
              onClick={() => handleLayoutChange(2)}
            >
              2
            </button>
            <button
              className={`layout-buttons ${numberInRow === 3 ? 'active' : ''}`}
              onClick={() => handleLayoutChange(3)}
            >
              3
            </button>
            {/* etc. */}
          </div>
        </div>

        <PaginatedResourceSection
          key={`products-grid-${numberInRow}`}
          connection={{
            ...collection.products,
            nodes: products, // no client re-sorting
          }}
          resourcesClassName={`products-grid grid-cols-${numberInRow}`}
        >
          {({node: product, index}) => (
            <ProductItem
              key={product.id}
              product={product}
              index={index}
              numberInRow={numberInRow}
            />
          )}
        </PaginatedResourceSection>
      </div>

      <Analytics.CollectionView
        data={{
          collection: {
            id: collection.id,
            handle: collection.handle,
          },
        }}
      />
    </div>
  );
}

/**
 * A safe "ProductItem" that doesn't re-check inventory or re-sort variants.
 * Always picks variant[0].
 */
const ProductItem = React.memo(({product}) => {
  const ref = useRef(null);

  // Always pick the first variant
  const [selectedVariant] = useState(product.variants.nodes[0]);

  const variantUrl = useVariantUrl(
    product.handle,
    selectedVariant.selectedOptions,
  );

  const hasDiscount =
    product.compareAtPriceRange &&
    product.compareAtPriceRange.minVariantPrice.amount >
      product.priceRange.minVariantPrice.amount;

  return (
    <div className="product-item-collection product-card" ref={ref}>
      <div>
        <div className="mobile-container">
          <Link to={variantUrl} className="collection-product-link">
            {product.featuredImage && (
              <div className="collection-product-image">
                <Image
                  srcSet={`${product.featuredImage.url}?width=300&quality=15 300w,
                           ${product.featuredImage.url}?width=600&quality=15 600w,
                           ${product.featuredImage.url}?width=1200&quality=15 1200w`}
                  alt={product.featuredImage.altText || product.title}
                  loading="lazy"
                  width="180px"
                  height="180px"
                />
              </div>
            )}
          </Link>
          <div className="product-info-container">
            <Link to={variantUrl}>
              <h4>{truncateText(product.title, 30)}</h4>
              <p className="product-description">
                {truncateText(product.description, 90)}
              </p>
              <div className="price-container">
                <small
                  className={`product-price ${hasDiscount ? 'discounted' : ''}`}
                >
                  <Money data={selectedVariant.price} />
                </small>
                {hasDiscount && selectedVariant.compareAtPrice && (
                  <small className="discountedPrice">
                    <Money data={selectedVariant.compareAtPrice} />
                  </small>
                )}
              </div>
            </Link>
            <ProductForm product={product} selectedVariant={selectedVariant} />
          </div>
        </div>
        <ProductForm product={product} selectedVariant={selectedVariant} />
      </div>
    </div>
  );
});

/**
 * Basic ProductForm that doesn't re-check variants
 */
function ProductForm({product, selectedVariant}) {
  const {open} = useAside();
  const hasVariants = product.variants.nodes.length > 1;

  return (
    <div className="product-form">
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          if (hasVariants) {
            window.location.href = `/products/${encodeURIComponent(
              product.handle,
            )}`;
          } else {
            open('cart');
          }
        }}
        lines={
          selectedVariant && !hasVariants
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  attributes: [],
                  product: {
                    ...product,
                    selectedVariant,
                    handle: product.handle,
                  },
                },
              ]
            : []
        }
      >
        {!selectedVariant?.availableForSale
          ? 'Sold out'
          : hasVariants
          ? 'Select Options'
          : 'Add to cart'}
      </AddToCartButton>
    </div>
  );
}

const MENU_QUERY = `#graphql
  query GetMenu($handle: String!) {
    menu(handle: $handle) {
      items {
        title
        url
      }
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = `#graphql
  query GetCollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      id
      title
      description
      handle
      image {
        url
        altText
      }
    }
  }
`;

const PRODUCT_ITEM_FRAGMENT = `#graphql
  fragment MoneyProductItem on MoneyV2 {
    amount
    currencyCode
  }
  fragment ProductItem on Product {
    id
    handle
    title
    description
    featuredImage {
      id
      altText
      url
      width
      height
    }
    options {
      name
      values
    }
    priceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        ...MoneyProductItem
      }
      maxVariantPrice {
        ...MoneyProductItem
      }
    }
    variants(first: 25) {
      nodes {
        id
        availableForSale
        selectedOptions {
          name
          value
        }
        image {
          id
          url
          altText
          width
          height
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        sku
        title
        unitPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

const COLLECTION_QUERY = `#graphql
  ${PRODUCT_ITEM_FRAGMENT}
  query Collection(
    $handle: String!
    $filters: [ProductFilter!]
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $first: Int
    $last: Int
    $startCursor: String
    $endCursor: String
  ) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      seo {
        title
        description
      }
      image {
        url
        altText
      }
      products(
        first: $first,
        last: $last,
        before: $startCursor,
        after: $endCursor,
        filters: $filters,
        sortKey: $sortKey,
        reverse: $reverse
      ) {
        filters {
          id
          label
          type
          values {
            id
            label
            count
            input
          }
        }
        nodes {
          ...ProductItem
          availableForSale
        }
        pageInfo {
          hasPreviousPage
          hasNextPage
          endCursor
          startCursor
        }
      }
    }
  }
`;
