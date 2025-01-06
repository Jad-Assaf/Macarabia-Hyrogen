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
import {DrawerFilter} from '~/modules/drawer-filter';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';
import {AddToCartButton} from '~/components/AddToCartButton';
import {useAside} from '~/components/Aside';
import {getAppliedFilterLink} from '~/lib/filter';
// ... plus your other imports

export default function Collection() {
  const {collection, appliedFilters, sliderCollections} = useLoaderData();
  const [userSelectedNumberInRow, setUserSelectedNumberInRow] = useState(null);

  function calculateNumberInRow(width, userSelection) {
    if (userSelection !== null) return userSelection;
    return 1; // always default to 1
  }

  const [screenWidth, setScreenWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0,
  );
  const [numberInRow, setNumberInRow] = useState(
    typeof window !== 'undefined'
      ? calculateNumberInRow(window.innerWidth, userSelectedNumberInRow)
      : 1,
  );

  // (No more useMediaQuery)

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      setNumberInRow(calculateNumberInRow(width, userSelectedNumberInRow));
    };

    updateLayout();

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

  // --- No client sorting. Just use collection.products.nodes directly. ---
  const products = collection.products.nodes || [];

  return (
    <div className="collection">
      <h1>{collection.title}</h1>

      {/* Always render the sliderCollections (if any). No condition on isDesktop */}
      {sliderCollections?.length > 0 && (
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

      {/* Always render FiltersDrawer. Hide in CSS if small screen. */}
      <DrawerFilter
        filters={collection.products.filters}
        appliedFilters={appliedFilters}
        collections={
          [
            /* ... */
          ]
        }
        onRemoveFilter={handleFilterRemove}
      />

      <div className="view-container">
        <div className="layout-controls">
          <span className="number-sort">View As:</span>
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
          {/* etc... */}
        </div>
      </div>

      <PaginatedResourceSection
        key={`products-grid-${numberInRow}`}
        connection={{
          ...collection.products,
          nodes: products, // no client sorting
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

      <Analytics.CollectionView
        data={{
          collection: {id: collection.id, handle: collection.handle},
        }}
      />
    </div>
  );
}

/** Minimal stable ProductItem */
function ProductItem({product}) {
  // Always pick the same variant. No fancy 'first available':
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
    <div className="product-item-collection product-card">
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
  );
}

function ProductForm({product, selectedVariant}) {
  const {open} = useAside();
  const hasVariants = product.variants.nodes.length > 1;

  return (
    <AddToCartButton
      disabled={!selectedVariant?.availableForSale}
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
  );
}
