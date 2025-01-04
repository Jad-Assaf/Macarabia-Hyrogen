import { Link } from '@remix-run/react';
import React, {useState} from 'react';

// Reusable Component for CollectionItem
const CollectionItem = ({collection, index}) => {
  const [isLoading, setIsLoading] = useState(true);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  return (
    <Link
      to={collection.url}
      className={`menu-item-container ${isLoading ? 'loading' : ''}`}
    >
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
            onLoad={handleImageLoad}
          />
        )}
      </div>
      <div className="category-title">{collection.title}</div>
    </Link>
  );
};

// First Collection
export const menuCollectionOne = [
  {
    id: 1,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/12fd96e86a8a35b81eeaeca3d9ce823a.jpg?v=1714657013',
      altText: 'Apple Accessories',
    },
    title: 'Apple Accessories',
    url: '/collections/apple-accessories',
  },
  {
    id: 2,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/7c17e4425faa3ae0ea7a8989849774d8.jpg?v=1714656980',
      altText: 'Apple Macbooks',
    },
    title: 'Apple Macbooks',
    url: '/collections/apple-macbook',
  },
];

// Second Collection
export const menuCollectionTwo = [
  {
    id: 3,
    image: {
      url: 'https://example.com/image3.jpg',
      altText: 'Collection 3 Image',
    },
    title: 'Collection 3',
    url: '/collections/collection-3',
  },
  {
    id: 4,
    image: {
      url: 'https://example.com/image4.jpg',
      altText: 'Collection 4 Image',
    },
    title: 'Collection 4',
    url: '/collections/collection-4',
  },
];

// Reusable Mapping Function
export const CollectionCircles = ({collections}) => {
  return (
    <div className="animated-menu">
      {collections.map((collection, collectionIndex) => (
        <div className="animated-menu-item" key={collection.id}>
          <CollectionItem collection={collection} index={collectionIndex} />
        </div>
      ))}
    </div>
  );
};
