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

  // Get the collections to display
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

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

              return (
                <div
                  key={collection.id}
                  ref={ref}
                  style={{
                    opacity: inView ? 1 : 0,
                    transition: `opacity 0.5s ease ${collectionIndex * 0.1}s`,
                  }}
                >
                  <CollectionItem
                    collection={collection}
                    index={collectionIndex}
                  />
                </div>
              );
            })}
          </div>

          {menuCollection.slice(0, 2).map((collection) => {
            const [productRowRef, productRowInView] = useInView({
              triggerOnce: true,
              rootMargin: '200px',
            });

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
                    opacity: productRowInView ? 1 : 0,
                    transition: 'opacity 0.5s ease',
                  }}
                >
                  {productRowInView && (
                    <ProductRow products={collection.products.nodes} />
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
