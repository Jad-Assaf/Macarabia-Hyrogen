import React from 'react';
import {Link} from 'react-router-dom'; // Adjust import as needed for routing

export default function MenuItemsByHandle({menu, handle}) {
  const menuItem = menu.items.find(
    (item) => item && item.title.toLowerCase() === handle.toLowerCase()
  );

  if (!menuItem) {
    return <p>Menu item not found.</p>;
  }

  return (
    <div className="menu-slider-container">
      {menu.items
        .filter((item) => item) // Filter out null items
        .map((collection, index) => (
          <div className="animated-menu-item" key={collection.id}>
            <CollectionItem collection={collection} index={index} />
          </div>
        ))}
    </div>
  );
}

// Updated CollectionItem Component
export const CollectionItem = ({collection}) => {
  return (
    <Link to={collection.url} className="menu-item-container">
      <div className="menu-item-image-wrapper">
        {collection.image && (
          <img
            src={`${collection.image.url}?width=300&quality=15`}
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
      </div>
      <div className="category-title">{collection.title}</div>
    </Link>
  );
};
