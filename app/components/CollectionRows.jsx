import React, {useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';

/**
 * menuCollections is still an array of arrays, e.g.:
 * [
 *   [Apple Macbook, Apple iPhone, ...], // group0
 *   [Samsung phones, Samsung tablets],  // group1
 *   ...
 * ]
 */
export default function CollectionRows({menuCollections}) {
  const [isMobile, setIsMobile] = useState(false);
  // Which group is shown right now?
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Check if screen width < 768px
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Possibly limit the number of groups on mobile
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  return (
    <>
      {displayedCollections.map((menuCollection, groupIndex) => {
        // If this group's index is > activeGroupIndex, do not render yet
        if (groupIndex > activeGroupIndex) {
          return null; // hide future rows
        }

        // Otherwise show it
        return (
          <CollectionGroup
            key={groupIndex}
            menuCollection={menuCollection}
            groupIndex={groupIndex}
            // once the fade-in completes for this group, reveal the next
            onGroupFadeComplete={() =>
              setActiveGroupIndex((prev) => Math.max(prev, groupIndex + 1))
            }
          />
        );
      })}
    </>
  );
}

/**
 * Renders a single row (group) of sub-collections.
 * After it finishes its fade-in, call onGroupFadeComplete().
 */
function CollectionGroup({menuCollection, groupIndex, onGroupFadeComplete}) {
  // We'll do a fade from 0 → 1 opacity over 600ms
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger the fade as soon as we mount
    setFadeIn(true);

    // Once 600ms pass, we consider the fade done
    const timer = setTimeout(() => {
      onGroupFadeComplete?.();
    }, 600);

    return () => clearTimeout(timer);
  }, [onGroupFadeComplete]);

  const containerStyle = {
    opacity: fadeIn ? 1 : 0,
    transition: 'opacity 0.6s ease',
  };

  return (
    <div style={containerStyle}>
      <div className="menu-slider-container">
        {menuCollection.map((collection, collectionIndex) => (
          <div
            key={collection.id}
            style={{
              // If you still want a *stagger* within the row, you can do so:
              transitionDelay: `${collectionIndex * 0.1}s`,
            }}
          >
            <CollectionItem collection={collection} />
          </div>
        ))}
      </div>

      {/* "ProductRow" for the first 2 items in this group, same as your code */}
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
          {/* Render the product row if it exists */}
          {collection.products?.nodes?.length ? (
            <ProductRow products={collection.products.nodes} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/**
 * Basic sub-collection item
 */
function CollectionItem({collection}) {
  return (
    <Link to={`/collections/${collection.handle}`} className="menu-item-container">
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
}
