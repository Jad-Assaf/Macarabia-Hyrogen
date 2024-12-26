import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

/* 1) Minimal shimmer keyframes. You could also put this in a global CSS file. */
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

/* We inject keyframes into <head> (only on client). 
   For a real app, place this in your CSS. */
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = shimmerKeyframes;
  document.head.appendChild(styleTag);
}

/* 2) A small shimmer placeholder for an individual collection item. */
function ShimmerCollectionItem() {
  return (
    <div style={styles.shimmerContainer}>
      <div style={styles.shimmerImage} />
      <div style={styles.shimmerLine} />
    </div>
  );
}

/* 3) A small shimmer placeholder for product rows. 
   We'll just show 4 boxes to represent 4 loading items. */
function ShimmerProductRow() {
  return (
    <div style={styles.rowShimmerContainer}>
      {[...Array(4)].map((_, idx) => (
        <div key={idx} style={styles.rowShimmerBox} />
      ))}
    </div>
  );
}

/* Your existing code, extended to show a shimmer if !isLoaded */
const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [loadedCollections, setLoadedCollections] = useState([]); // Tracks which collections have been loaded

  // Check if the screen width is less than 768px
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get the collections to display
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
          {/* Render the menu slider */}
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

              const isLoaded = loadedCollections.includes(collection.id);

              return (
                <div
                  key={collection.id}
                  ref={ref}
                  style={{
                    opacity: isLoaded ? 1 : 0,
                    transition: `opacity 0.5s ease ${collectionIndex * 0.1}s`,
                  }}
                >
                  {isLoaded ? (
                    <CollectionItem
                      collection={collection}
                      index={collectionIndex}
                    />
                  ) : (
                    <ShimmerCollectionItem />
                  )}
                </div>
              );
            })}
          </div>

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

const CollectionItem = ({collection}) => {
  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="menu-item-container"
    >
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
        />
      )}
      <div className="category-title">{collection.title}</div>
    </Link>
  );
};

export default CollectionRows;

/* Inline styling for the shimmer placeholders */
const styles = {
  shimmerContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '150px',
    margin: '0 auto',
  },
  shimmerImage: {
    width: '150px',
    height: '150px',
    borderRadius: '8px',
    background: '#f6f7f8',
    backgroundImage:
      'linear-gradient(to right, #f6f7f8 0%, #eaeaea 20%, #f6f7f8 40%, #f6f7f8 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '800px 104px',
    animation: 'placeholderShimmer 1s linear infinite forwards',
    marginBottom: '8px',
  },
  shimmerLine: {
    width: '70%',
    height: '12px',
    borderRadius: '4px',
    background: '#f6f7f8',
    backgroundImage:
      'linear-gradient(to right, #f6f7f8 0%, #eaeaea 20%, #f6f7f8 40%, #f6f7f8 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '800px 104px',
    animation: 'placeholderShimmer 1s linear infinite forwards',
  },
  rowShimmerContainer: {
    display: 'flex',
    gap: '1rem',
    overflow: 'hidden',
    padding: '1rem 0',
  },
  rowShimmerBox: {
    width: '150px',
    height: '180px',
    borderRadius: '8px',
    background: '#f6f7f8',
    backgroundImage:
      'linear-gradient(to right, #f6f7f8 0%, #eaeaea 20%, #f6f7f8 40%, #f6f7f8 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '800px 104px',
    animation: 'placeholderShimmer 1s linear infinite forwards',
  },
};
