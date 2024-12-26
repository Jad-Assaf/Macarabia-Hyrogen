import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

/* Minimal shimmer keyframes (already provided). In a real app, put them in CSS. */
const shimmerKeyframes = `
@keyframes placeholderShimmer {
  0% {
    background-position: -800px 0;
  }
  100% {
    background-position: 800px 0;
  }
}
`;

/* Inject the keyframes into <head> if on client. */
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = shimmerKeyframes;
  document.head.appendChild(styleTag);
}

/* A shimmer placeholder for an individual collection item */
function ShimmerOverlay({width = 150, height = 150}) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        background: '#f6f7f8',
        backgroundImage:
          'linear-gradient(to right, #f6f7f8 0%, #eaeaea 20%, #f6f7f8 40%, #f6f7f8 100%)',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '800px 104px',
        animation: 'placeholderShimmer 1s linear infinite forwards',
        borderRadius: '8px',
      }}
    />
  );
}

/**
 * Show 4 shimmer boxes in a row for product placeholders
 */
function ShimmerProductRow() {
  return (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        position: 'relative',
        margin: '1rem 0',
      }}
    >
      {Array.from({length: 4}).map((_, i) => (
        <div
          key={i}
          style={{
            width: '150px',
            height: '180px',
            borderRadius: '8px',
            background: '#f6f7f8',
            backgroundImage:
              'linear-gradient(to right, #f6f7f8 0%, #eaeaea 20%, #f6f7f8 40%, #f6f7f8 100%)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '800px 104px',
            animation: 'placeholderShimmer 1s linear infinite forwards',
          }}
        />
      ))}
    </div>
  );
}

const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [loadedCollections, setLoadedCollections] = useState([]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Possibly limit total groups for mobile
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  const handleInView = (collectionId) => {
    if (!loadedCollections.includes(collectionId)) {
      setLoadedCollections((prev) => [...prev, collectionId]);
    }
  };

  return (
    <>
      {displayedCollections.map((menuCollection) => (
        <React.Fragment key={menuCollection.id}>
          {/* "menu-slider-container" row */}
          <div className="menu-slider-container">
            {menuCollection.map((collection, collectionIndex) => {
              const [ref, inView] = useInView({
                triggerOnce: true,
                rootMargin: '200px',
              });

              useEffect(() => {
                if (inView) {
                  handleInView(collection.id);
                }
              }, [inView]);

              // "Loaded" means it's in the viewport (Intersection observer),
              // so we mount the <CollectionItem> or keep the shimmer if we prefer.
              // But the item itself will handle the actual image load.
              const isLoaded = loadedCollections.includes(collection.id);

              return (
                <div
                  key={collection.id}
                  ref={ref}
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transition: `opacity 0.5s ease ${collectionIndex * 0.1}s`,
                    position: 'relative',
                  }}
                >
                  {isLoaded ? (
                    <CollectionItem
                      collection={collection}
                      index={collectionIndex}
                    />
                  ) : (
                    /* If not inView yet, we can either show nothing or show a placeholder 
                       for the entire container. For example: */
                    <div
                      style={{
                        width: '150px',
                        height: '200px',
                        position: 'relative',
                      }}
                    >
                      <ShimmerOverlay width={150} height={150} />
                      {/* Possibly a smaller line for the title, or skip it */}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* First 2 => ProductRow */}
          {menuCollection.slice(0, 2).map((collection) => {
            const [productRowRef, productRowInView] = useInView({
              triggerOnce: true,
              rootMargin: '200px',
            });

            useEffect(() => {
              if (productRowInView) {
                handleInView(collection.id);
              }
            }, [productRowInView]);

            const isLoaded = loadedCollections.includes(collection.id);

            return (
              <div key={collection.id} className="collection-section">
                <div className="collection-header">
                  <h3>{collection.title}</h3>
                  <Link
                    to={`/collections/${collection.handle}`}
                    className="view-all-link"
                  >
                    View All
                  </Link>
                </div>
                <div
                  ref={productRowRef}
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                  }}
                >
                  {isLoaded ? (
                    <ProductRow products={collection.products.nodes} />
                  ) : (
                    <ShimmerProductRow />
                  )}
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
    </>
  );
};

export default CollectionRows;

/**
 * 2) Updated <CollectionItem> that shows a local shimmer overlay
 *    while the actual <Image> is still loading.
 */
export function CollectionItem({collection}) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="menu-item-container"
      style={{position: 'relative', display: 'inline-block', width: '150px'}}
    >
      {/* The shimmer overlay is absolutely positioned on top
          until we see the image’s onLoad event. */}
      {!imgLoaded && <ShimmerOverlay width={150} height={150} />}

      {collection.image && (
        <Image
          srcSet={`${collection.image.url}?width=300&quality=15 300w,
                   ${collection.image.url}?width=600&quality=15 600w,
                   ${collection.image.url}?width=1200&quality=15 1200w`}
          alt={collection.image.altText || collection.title}
          className="menu-item-image"
          width={150}
          height={150}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          /* onError={() => handle error if needed} */
          style={
            {
              // If you want to keep space for the image even while loading,
              // ensure width/height or aspect ratio is defined.
            }
          }
        />
      )}
      <div className="category-title">{collection.title}</div>
    </Link>
  );
}
