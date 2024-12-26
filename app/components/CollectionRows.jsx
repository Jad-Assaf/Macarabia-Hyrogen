import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen width is less than 768px
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Decide how many collections to display
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  return (
    <>
      {displayedCollections.map((menuCollection, collectionGroupIndex) => (
        <CollectionGroup
          key={collectionGroupIndex}
          menuCollection={menuCollection}
        />
      ))}
    </>
  );
};

const CollectionGroup = ({menuCollection}) => {
  /**
   * We’ll use a single Intersection Observer for the entire "group" of
   * `CollectionItem` plus the `ProductRow`—so we observe a wrapper div.
   */
  const {ref, inView} = useInView({
    triggerOnce: true,
    rootMargin: '200px',
  });

  /**
   * This state tells us how many CollectionItems have been “revealed” so far.
   * If we have, say, 5 items in `menuCollection`, we will let
   * `revealedCount` go from -1 to 4 (or 0 to 4, whichever you prefer).
   */
  const [revealedCount, setRevealedCount] = useState(-1);

  /**
   * Once the parent container is inView, we trigger a timed reveal
   * for each CollectionItem (and eventually for ProductRow).
   */
  useEffect(() => {
    if (!inView) return;

    // If already in view, start revealing items in sequence
    const itemCount = menuCollection.length;
    // We reveal each item in 300ms intervals (change as needed):
    menuCollection.forEach((_, index) => {
      setTimeout(() => {
        setRevealedCount((prev) => Math.max(prev, index));
      }, index * 300);
    });

    return () => {
      // Optional: if you'd like to clear timeouts on unmount
    };
  }, [inView, menuCollection]);

  /**
   * We only show the ProductRow once all items in the group
   * have been revealed. i.e. once `revealedCount` reaches itemCount - 1.
   */
  const allItemsRevealed = revealedCount >= menuCollection.length - 1;

  return (
    <div ref={ref}>
      {/* 
         We’ll map over the entire array to render each CollectionItem.
         Each item’s opacity depends on whether its index <= revealedCount.
      */}
      <div className="menu-slider-container">
        {menuCollection.map((collection, index) => {
          const isVisible = index <= revealedCount; // fade in once revealed
          return (
            <div
              key={collection.id}
              style={{
                opacity: isVisible ? 1 : 0,
                transition: `opacity 0.5s ease ${index * 0.1}s`,
              }}
            >
              {isVisible && (
                <CollectionItem collection={collection} index={index} />
              )}
            </div>
          );
        })}
      </div>

      {/* 
         Then we show the ProductRow only after all items in this group
         have been revealed. You can also apply a small delay if you wish.
      */}
      {allItemsRevealed && (
        <>
          {/**
           * In your original code, you only take `menuCollection.slice(0, 2)`
           * for the product row. Keep the same logic or adapt as needed:
           */}
          {menuCollection.slice(0, 2).map((collection) => (
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
                style={{
                  opacity: 1,
                  transition: 'opacity 0.5s ease',
                }}
              >
                <ProductRow products={collection.products.nodes} />
              </div>
            </div>
          ))}
        </>
      )}
    </div>
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
