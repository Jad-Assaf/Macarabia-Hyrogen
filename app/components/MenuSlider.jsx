// components/MenuSlider.jsx

import React from 'react';
import PropTypes from 'prop-types';
import { CollectionItem } from './CollectionRows';

/**
 * MenuSlider Component
 * Renders a slider of collections based on the provided menu handle and its collections.
 *
 * @param {Object} props
 * @param {string} props.menuHandle - The handle of the menu (e.g., 'main-menu').
 * @param {Array<Object>} props.collections - An array of collection objects to display.
 */
export default function MenuSlider({menuHandle, collections}) {
  if (!collections || collections.length === 0) {
    return (
      <div className="menu-slider-container">
        No collections found for {menuHandle}.
      </div>
    );
  }

  return (
    <div className="menu-slider-section">
      <h2 className="menu-slider-title">{formatMenuHandle(menuHandle)}</h2>
      <div className="menu-slider-container">
        {collections.map((collection, collectionIndex) => (
          <div className="animated-menu-item" key={collection.id}>
            <CollectionItem collection={collection} index={collectionIndex} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Formats the menu handle into a readable title.
 * Example: 'main-menu' -> 'Main Menu'
 *
 * @param {string} handle - The menu handle to format.
 * @returns {string} - The formatted title.
 */
function formatMenuHandle(handle) {
  return handle
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

MenuSlider.propTypes = {
  menuHandle: PropTypes.string.isRequired,
  collections: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      handle: PropTypes.string.isRequired,
      image: PropTypes.shape({
        url: PropTypes.string,
        altText: PropTypes.string,
      }),
    }),
  ).isRequired,
};
