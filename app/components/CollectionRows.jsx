import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

/**
 * menuCollections is still an array of arrays,
 * e.g. [ [colA1, colA2], [colB1, colB2], ... ].
 */
const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [loadedCollections, setLoadedCollections] = useState([]); // which individual sub-collections have loaded
  const [activeGroupIndex, setActiveGroupIndex] = useState(0); // which group is currently allowed to render

  // Check if the screen width is less than 768px
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trim total groups for mobile if needed
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  // This function is called when a sub-collection or productRow is in view
  const handleInView = (collectionId) => {
    if (!loadedCollections.includes(collectionId)) {
      setLoadedCollections((prev) => [...prev, collectionId]);
    }
  };

  // This function is called when the entire group finishes loading
  // so we can “unlock” the next group
  const handleGroupLoaded = (groupIndex) => {
    // If the current group is the same as groupIndex, let the next group appear
    setActiveGroupIndex((prev) => (prev === groupIndex ? prev + 1 : prev));
  };

  return (
    <>
      {displayedCollections.map((menuCollection, groupIndex) => {
        // If this group’s index is greater than the activeGroupIndex, skip rendering
        if (groupIndex > activeGroupIndex) {
          return null;
        }

        // Otherwise render the group
        // We’ll pass a callback so that once the group is fully “observed,”
        // it calls handleGroupLoaded to reveal the next group.
        return (
          <CollectionGroup
            key={`group-${groupIndex}`}
            menuCollection={menuCollection}
            groupIndex={groupIndex}
            handleInView={handleInView}
            loadedCollections={loadedCollections}
            onGroupLoaded={handleGroupLoaded}
          />
        );
      })}
    </>
  );
};

/**
 * Renders one “group” of sub-collections (the array `menuCollection`),
 * as well as the first 2 “ProductRows” from that group,
 * exactly as your original code does. The difference:
 * - We track when all sub-collections are in view,
 *   and then call `onGroupLoaded(groupIndex)`.
 */
function CollectionGroup({
  menuCollection,
  groupIndex,
  handleInView,
  loadedCollections,
  onGroupLoaded,
}) {
  const [groupDone, setGroupDone] = useState(false);

  // We might consider the group “done” once all sub-collections in this group
  // are in `loadedCollections`. Or, you could do an IntersectionObserver on a "groupRef".
  useEffect(() => {
    // If every sub-collection in `menuCollection` has been loaded, mark group as done
    const allLoaded = menuCollection.every((col) =>
      loadedCollections.includes(col.id),
    );

    if (allLoaded && !groupDone) {
      setGroupDone(true);
      // Let the parent know we’re done
      onGroupLoaded(groupIndex);
    }
  }, [menuCollection, loadedCollections, groupDone, onGroupLoaded, groupIndex]);

  return (
    <React.Fragment>
      {/* “Row” of sub-collections, same as your original “menu-slider-container” */}
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
              {isLoaded && (
                <CollectionItem
                  collection={collection}
                  index={collectionIndex}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* The first 2 items get “ProductRow” exactly as before */}
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
              {isLoaded && (
                <ProductRow products={collection.products.nodes} />
              )}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
}

function CollectionItem({collection}) {
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
}

export default CollectionRows;
