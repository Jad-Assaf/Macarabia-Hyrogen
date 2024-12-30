import React, {useState} from 'react';
import {Link} from 'react-router-dom';
import {useInView} from 'react-intersection-observer';

/**
 * MenuSlider Component
 * Displays menu items with their image and title based on a passed handle.
 */
const MenuSlider = ({handle, menuCollection}) => {
  if (!menuCollection || menuCollection.length === 0) {
    return null;
  }

  return (
    <div className="menu-slider-container">
      <h2>{handle.charAt(0).toUpperCase() + handle.slice(1)} Menu</h2>
      <div className="menu-items">
        {menuCollection.map((collection, collectionIndex) => {
          const {ref, inView} = useInView({
            triggerOnce: true,
            threshold: 0.1,
          });

          return (
            <div className="animated-menu-item" ref={ref} key={collection.id}>
              {inView && (
                <Link
                  to={`/collections/${collection.handle}`}
                  className="menu-item-container"
                >
                  <div className="menu-item-image-wrapper">
                    {/* Commented out the image rendering */}
                    {/* <CollectionImage collection={collection} /> */}
                  </div>
                  <div className="category-title">{collection.title}</div>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * CollectionImage Component
 * Handles image rendering and loading state.
 */
const CollectionImage = ({collection}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <>
      {/* Commented out the entire image rendering block */}
      {/* {isLoading && <div className="menu-item-shimmer-effect"></div>}
      {collection.image && (
        <img
          src={`${collection.image.url}?width=300&quality=15`}
          srcSet={`${collection.image.url}?width=300&quality=15 300w,
                   ${collection.image.url}?width=600&quality=15 600w,
                   ${collection.image.url}?width=1200&quality=15 1200w`}
          alt={collection.image.altText || collection.title}
          className={`menu-item-image ${
            isLoading ? '' : 'menu-item-image-loaded'
          }`}
          width={150}
          height={150}
          loading="lazy"
          onLoad={handleImageLoad}
        />
      )} */}
    </>
  );
};

export default MenuSlider;
