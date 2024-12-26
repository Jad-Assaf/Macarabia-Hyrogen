import React, {useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';

/**
 * "menuCollections" is still an array of arrays:
 * [
 *   [collectionA1, collectionA2, collectionA3], // group 0
 *   [collectionB1, collectionB2],              // group 1
 *   ...
 * ]
 */
const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Which group index is currently visible
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);

  // Screen-size check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Possibly trim the total groups we display on mobile
  const displayedGroups = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  return (
    <>
      {displayedGroups.map((menuCollection, groupIndex) => {
        // If the group’s index is greater than activeGroupIndex, skip rendering
        if (groupIndex > activeGroupIndex) {
          return null;
        }

        // Otherwise render the group
        return (
          <CollectionGroup
            key={`group-${groupIndex}`}
            menuCollection={menuCollection}
            groupIndex={groupIndex}
            onGroupComplete={() => {
              // After this group has fully "loaded" or "faded in", show next
              setActiveGroupIndex((prev) => prev + 1);
            }}
          />
        );
      })}
    </>
  );
};

export default CollectionRows;

/**
 * This component renders ONE group of sub-collections
 * in the same style you had before, but we fade it in
 * and after some time/event, we call onGroupComplete().
 */
function CollectionGroup({menuCollection, groupIndex, onGroupComplete}) {
  // We'll do a simple fade in for the entire group, then call onGroupComplete
  const [isFadingIn, setIsFadingIn] = useState(false);

  useEffect(() => {
    setIsFadingIn(true);
    // Example: wait 1 second after showing, then declare "done"
    const timer = setTimeout(() => {
      onGroupComplete?.();
    }, 1000);

    return () => clearTimeout(timer);
  }, [onGroupComplete]);

  const groupStyle = {
    opacity: isFadingIn ? 1 : 0,
    transition: 'opacity 1s ease',
  };

  return (
    <div style={groupStyle}>
      {/* "Row" of sub-collections, same as your original "menu-slider-container" */}
      <div className="menu-slider-container">
        {menuCollection.map((collection, collectionIndex) => {
          return (
            <CollectionItem
              key={collection.id}
              collection={collection}
              collectionIndex={collectionIndex}
            />
          );
        })}
      </div>

      {/* Then your "first 2" ProductRow logic, as before */}
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
          <div style={{transition: 'opacity 0.5s ease'}}>
            {collection.products?.nodes?.length ? (
              <ProductRow products={collection.products.nodes} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Your original sub-collection link item
 */
function CollectionItem({collection}) {
  return (
    <div>
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
    </div>
  );
}
