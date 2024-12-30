import React, {useEffect, useState} from 'react';

/**
 * MenuComponent
 * Fetches and displays menu items for a given handle.
 *
 * @param {string} handle - The menu handle to fetch.
 * @param {function} fetchMenu - The function to fetch menu data using the handle.
 */
const MenuComponent = ({handle, fetchMenu}) => {
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    if (handle) {
      // Fetch the menu items when the handle is available
      fetchMenu(handle).then((menu) => {
        if (menu?.items) {
          setMenuItems(menu.items);
        }
      });
    }
  }, [handle, fetchMenu]);

  if (!menuItems || menuItems.length === 0) {
    return <p>No menu items available for "{handle}".</p>;
  }

  return (
    <div className="menu-component">
      <h2>{handle.charAt(0).toUpperCase() + handle.slice(1)} Menu</h2>
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.id} className="menu-item">
            <a href={item.url} className="menu-link">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenuComponent;
