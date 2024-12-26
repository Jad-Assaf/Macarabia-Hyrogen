import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';

/**
 * This component receives `menuCollections` as a single array (flattened).
 * We display them one by one in sequence.
 */
export default function CollectionRows({menuCollections}) {
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0); // which collection index is currently shown

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Decide how many to show on mobile
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  // A callback that each CollectionItem calls once its fade-in is done
  const handleCollectionLoaded = (index) => {
    // If this collection is the current activeIndex, increment to reveal the next
    setActiveIndex((prev) => (index === prev ? prev + 1 : prev));
  };

  return (
    <>
      {displayedCollections.map((collection, index) => {
        // If an item’s index is > activeIndex, don’t show it yet
        const isVisible = index <= activeIndex;

        return (
          <div key={collection.id} className="sequential-collection-container">
            {isVisible && (
              <CollectionItem
                collection={collection}
                index={index}
                onLoadComplete={() => handleCollectionLoaded(index)}
              />
            )}
          </div>
        );
      })}
    </>
  );
}

function CollectionItem({collection, index, onLoadComplete}) {
  // We'll fade in this item, then call onLoadComplete when done
  const [isFadingIn, setIsFadingIn] = useState(false);

  useEffect(() => {
    // Start fade-in, then after 600ms (for example) notify parent
    setIsFadingIn(true);
    const timer = setTimeout(() => {
      onLoadComplete?.();
    }, 600);
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  // Feel free to style or animate however you want:
  const containerStyle = {
    opacity: isFadingIn ? 1 : 0,
    transition: 'opacity 0.6s ease',
  };

  return (
    <div style={containerStyle}>
      {/* The "slider" portion */}
      <div className="menu-slider-container">
        <div className="menu-item-container">
          <Link to={`/collections/${collection.handle}`}>
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
        </div>
      </div>

      {/* Optionally: If you want a ProductRow for *every* collection */}
      <div className="collection-section">
        <div className="collection-header">
          <h3>{collection.title}</h3>
          <Link
            to={`/collections/${collection.handle}`}
            className="view-all-link"
          >
            View All
          </Link>
        </div>
        <div style={{transition: 'opacity 0.5s ease'}}>
          {/* Render products if they exist */}
          {collection.products?.nodes?.length ? (
            <ProductRow products={collection.products.nodes} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
