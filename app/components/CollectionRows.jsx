// CollectionRows.jsx
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

    // Set the initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup event listener
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
            <CollectionItem collection={menuCollection} />
          </div>

          {/* Render the product row */}
          <div className="collection-section">
            <div className="collection-header">
              <h3>{menuCollection.title}</h3>
              <Link
                to={`/collections/${menuCollection.handle}`}
                className="view-all-link"
              >
                View All
              </Link>
            </div>
            <ProductRow products={menuCollection.products.nodes} />
          </div>
        </React.Fragment>
      ))}
    </>
  );
};

const CollectionItem = ({collection}) => {
  const [collectionRef, collectionInView] = useInView({
    triggerOnce: true,
  });

  return (
    <div ref={collectionRef} className="animated-menu-item">
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
};

export default CollectionRows;
