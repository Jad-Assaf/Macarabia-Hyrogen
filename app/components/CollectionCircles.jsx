import {Link} from '@remix-run/react';
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
export const appleMenu = [
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
    title: 'Apple Macbook',
    url: '/collections/apple-macbook',
  },
  {
    id: 3,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/f7585a000668e51f562541efa35d1178.jpg?v=1714657015',
      altText: 'Apple iMac',
    },
    title: 'Apple iMac',
    url: '/collections/apple-imac',
  },
  {
    id: 4,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/e3a857086e38bb988a5569c2cba8a08c.jpg?v=1714656972',
      altText: 'Apple iPad',
    },
    title: 'Apple iPad',
    url: '/collections/apple-ipad',
  },
  {
    id: 5,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/f74fe97487470214273fc892ff0d9dac.jpg?v=1714657017',
      altText: 'Apple Mac Mini',
    },
    title: 'Apple Mac Mini',
    url: '/collections/apple-mac-mini',
  },
  {
    id: 6,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/MJMV3-4_e0d1f591-fc63-4300-b086-2076a8b708af.jpg?v=1714657136',
      altText: 'Apple Mac Studio',
    },
    title: 'Apple Mac Studio',
    url: '/collections/apple-mac-studio',
  },
  {
    id: 7,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/0b93f20be8c5baec875c87a48cd5f330.jpg?v=1714657020',
      altText: 'Apple Watch',
    },
    title: 'Apple Watch',
    url: '/collections/apple-watch',
  },
];

// Second Collection
export const gamingMenu = [
  {
    id: 1,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/2481e9abe158cadab142174d138852a2.jpg?v=1714657038',
      altText: 'Gaming Laptops',
    },
    title: 'Gaming Laptops',
    url: '/collections/gaming-laptops',
  },
  {
    id: 2,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/gaming-desktop-offer-2.jpg?v=1714657143',
      altText: 'Gaming Desktops',
    },
    title: 'Gaming Desktops',
    url: '/collections/gaming-desktops',
  },
];

// Reusable Mapping Function
export const CollectionCircles = ({collections}) => {
  return (
    <div className="menu-slider-container">
      <div className="animated-menu-item">
        {collections.map((collection, collectionIndex) => (
          <div className="animated-menu-item" key={collection.id}>
            <CollectionItem collection={collection} index={collectionIndex} />
          </div>
        ))}
      </div>
    </div>
  );
};
