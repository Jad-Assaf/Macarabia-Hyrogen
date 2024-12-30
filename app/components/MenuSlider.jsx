import React from 'react';
import {useInView} from 'react-intersection-observer';
import {CollectionItem} from './CollectionRows';

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
                <CollectionItem
                  collection={collection}
                  index={collectionIndex}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MenuSlider;
