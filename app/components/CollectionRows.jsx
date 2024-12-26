import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [loadingQueue, setLoadingQueue] = useState([]); // Queue of collections to load
  const [currentlyLoading, setCurrentlyLoading] = useState(null); // Tracks the currently loading collection

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

  useEffect(() => {
    if (!currentlyLoading && loadingQueue.length > 0) {
      const nextCollection = loadingQueue[0];
      setCurrentlyLoading(nextCollection);
    }
  }, [currentlyLoading, loadingQueue]);

  const handleInView = (collectionId) => {
    if (!loadingQueue.includes(collectionId)) {
      setLoadingQueue((prevQueue) => [...prevQueue, collectionId]);
    }
  };

  const handleLoadComplete = (collectionId) => {
    setLoadingQueue((prevQueue) =>
      prevQueue.filter((id) => id !== collectionId),
    );
    setCurrentlyLoading(null);
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

              const isLoading = currentlyLoading === collection.id;

              return (
                <div
                  key={collection.id}
                  ref={ref}
                  style={{
                    opacity: isLoading ? 1 : 0,
                    transition: `opacity 0.5s ease ${collectionIndex * 0.1}s`,
                  }}
                >
                  {isLoading && (
                    <CollectionItem
                      collection={collection}
                      index={collectionIndex}
                      onLoadComplete={() => handleLoadComplete(collection.id)}
                    />
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

            const isLoading = currentlyLoading === collection.id;

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
                    opacity: isLoading ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                  }}
                >
                  {isLoading && (
                    <ProductRow
                      products={collection.products.nodes}
                      onLoadComplete={() => handleLoadComplete(collection.id)}
                    />
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

const CollectionItem = ({collection, onLoadComplete}) => {
  useEffect(() => {
    // Simulate load completion
    const timer = setTimeout(() => {
      onLoadComplete();
    }, 500); // Simulate loading duration
    return () => clearTimeout(timer);
  }, [onLoadComplete]);

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
