// MenuSlider.jsx
import React, {useEffect, useState} from 'react';
import {useInView} from 'react-intersection-observer';
import {CollectionItem} from './CollectionRows'; // Ensure correct path

/**
 * MenuSlider Component
 * Dynamically fetches and displays menu items with their image and title based on a passed handle.
 */
const MenuSlider = ({handle, fetchMenu, fetchCollection}) => {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (handle) {
      // Fetch menu items using the provided handle
      fetchMenu(handle).then(async (menu) => {
        if (menu && menu.items) {
          // Fetch detailed data for each menu item
          const collections = await Promise.all(
            menu.items.map((item) => fetchCollection(item.handle)),
          );
          setMenuItems(collections.filter(Boolean)); // Filter out any null or undefined responses
        }
      });
    }
  }, [handle, fetchMenu, fetchCollection]);

  if (!menuItems.length) {
    return null;
  }

  return (
    <div className="menu-slider-container">
      <h2>{handle.charAt(0).toUpperCase() + handle.slice(1)} Menu</h2>
      <div className="menu-items">
        {menuItems.map((collection, collectionIndex) => {
          const {ref, inView} = useInView({
            triggerOnce: true,
            threshold: 0.1, // Trigger when 10% of the component is visible
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
