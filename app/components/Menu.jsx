// src/components/Menu.jsx

import React from 'react';

/**
 * Menu Component
 *
 * @param {Object} props
 * @param {string} props.handle - The handle identifier for the menu.
 * @param {Object} props.menu - The menu data fetched from Shopify.
 */
export function Menu({handle, menu}) {
  if (!menu || !menu.items || menu.items.length === 0) return null;

  return (
    <nav className="menu-section">
      <h2 className="menu-title">
        {handle.charAt(0).toUpperCase() + handle.slice(1)}
      </h2>
      <ul className="menu-list">
        {menu.items.map((item) => (
          <li key={item.id} className="menu-item">
            <a href={item.url} className="menu-link">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
