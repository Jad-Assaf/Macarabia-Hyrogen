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
  {
    id: 3,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/Gaming-Monitors.jpg?v=1714657201',
      altText: 'Gaming Monitors',
    },
    title: 'Gaming Monitors',
    url: '/collections/gaming-monitors',
  },
  {
    id: 4,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/cbd4f23fcac98d9bf7769fa0e8983881.jpg',
      altText: 'Gaming Consoles',
    },
    title: 'Gaming Console',
    url: '/collections/gaming-consoles',
  },
  {
    id: 5,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/Console-Games-Collection.jpg?v=1714657198',
      altText: 'Console Games',
    },
    title: 'Console Games',
    url: '/collections/console-games',
  },
  {
    id: 6,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/Virtual-Reality-Collection.jpg?v=1714657200',
      altText: 'Virutal Reality',
    },
    title: 'Virutal Reality',
    url: '/collections/virtual-reality',
  },
  {
    id: 7,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/razer-blackwidow-2019-left-side.webp?v=1714657154',
      altText: 'Gaming Accessories',
    },
    title: 'Gaming Accessories',
    url: '/collections/gaming-accessories',
  },
  {
    id: 8,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/dead-skull.webp?v=1714657488',
      altText: 'Playstation Accessories',
    },
    title: 'PS Accessories',
    url: '/collections/ps-accessories',
  },
];

export const laptopsMenu = [
  {
    id: 1,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/be78f4b09d08ca7c9af85a5bda2b2066.jpg?v=1714656985',
      altText: 'Acer Laptops',
    },
    title: 'Acer Laptops',
    url: '/collections/acer-laptops',
  },
  {
    id: 2,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/6573823c46feafed973c1af406eff3ac.jpg?v=1714656986',
      altText: 'Asus Laptops',
    },
    title: 'Asus Laptops',
    url: '/collections/asus',
  },
  {
    id: 3,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/402c7e42624f70fb506dc8e2ba6ff5d0.jpg?v=1714656983',
      altText: 'Dell Laptops',
    },
    title: 'Dell Laptops',
    url: '/collections/dell',
  },
  {
    id: 4,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/c70dff45e570d9e5d8f15ed6553009fb.png?v=1714656977',
      altText: 'HP Laptops',
    },
    title: 'HP Laptops',
    url: '/collections/hp',
  },
  {
    id: 5,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/04dec497761e64442d9c73ebe4c9fd16.png?v=1714656979',
      altText: 'Lenovo Laptops',
    },
    title: 'Lenovo Laptops',
    url: '/collections/lenovo',
  },
  {
    id: 6,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/fb752f20e83a395208643dfa13893f3c.jpg?v=1714657083',
      altText: 'Microsoft Surface Laptops',
    },
    title: 'Microsoft Surface Laptops',
    url: '/collections/microsoft-surface',
  },
  {
    id: 7,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/67c41fb2ae61930080965e2b309a24f2.jpg?v=1714657009',
      altText: 'MSI Laptops',
    },
    title: 'MSI Laptops',
    url: '/collections/msi',
  },
];

export const desktopsMenu = [
  {
    id: 1,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/hp-victus-desktop.jpg?v=1714656988',
      altText: 'Branded Desktops',
    },
    title: 'Branded Desktops',
    url: '/collections/branded-desktops',
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
  {
    id: 3,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/29fa4b590132cda6ecb3c863dd618c20.jpg?v=1714656982',
      altText: 'All-in-one Desktops',
    },
    title: 'All-in-one Desktops',
    url: '/collections/all-in-one-desktops',
  },
  {
    id: 4,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/POS.jpg?v=1714657052',
      altText: 'POS',
    },
    title: 'POS',
    url: '/collections/pos',
  },
];

export const partsMenu = [
    {
        id: 1,
        image: {
            url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/mother-boards.jpg?v=1714657124',
            altText: 'Motherboards',
        },
        title: 'Branded Motherboards',
        url: '/collections/motherboards',
    },
    {
        id: 2,
        image: {
            url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/CPU_s.jpg?v=1714657125',
            altText: 'CPUs',
        },
        title: 'CPUs',
        url: '/collections/cpus',
    },
    {
        id: 3,
        image: {
            url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/CPU-Coolers.jpg?v=1714657122',
            altText: 'CPU Coolers',
        },
        title: 'CPU Coolers',
        url: '/collections/cpu-coolers',
    },
    {
        id: 4,
        image: {
            url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/GPU.jpg?v=1714657128',
            altText: 'GPUs',
        },
        title: 'GPUs',
        url: '/collections/GPU',
    },
    {
        id: 5,
        image: {
            url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/RAMS.jpg?v=1714657127',
            altText: 'RAM',
        },
        title: 'RAM',
        url: '/collections/ram',
    },
    {
        id: 6,
        image: {
            url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/ssd.jpg?v=1714657118',
      altText: 'Storage',
    },
    title: 'Storage',
    url: '/collections/storage',
},
{
    id: 7,
    image: {
        url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/Power-Supply.jpg?v=1714657005',
        altText: 'Power Supplies',
    },
    title: 'Power Supplies',
    url: '/collections/power-supplies',
},
{
    id: 8,
    image: {
        url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/813d80b0b251c24004edfdc06bd71d99_7dc23fcb-2256-427d-a171-d45e906d9cc7.jpg?v=1714657092',
        altText: 'Desktop Cases',
    },
    title: 'Desktop Cases',
    url: '/collections/cases',
},
];
export const networkingMenu = [
  {
    id: 1,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/Archer-VR2100.webp?v=1714657489',
      altText: 'WiFi Routers',
    },
    title: 'WiFi Routers',
    url: '/collections/widi-routers',
  },
  {
    id: 2,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/Mi-Wi-Fi-Range-Extender-Pro.webp?v=1714657494',
      altText: 'WiFi Range Extenders',
    },
    title: 'WiFi Range Extenders',
    url: '/collections/widi-range-extenders',
  },
  {
    id: 3,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/img_proxy_d8c6be1f-6467-4b6a-b278-93dcc57e76ec.jpg?v=1714657495',
      altText: 'Antennas',
    },
    title: 'Antennas',
    url: '/collections/outdoor-poe-antennas',
  },
  {
    id: 4,
    image: {
      url: 'https://cdn.shopify.com/s/files/1/0858/6821/6639/collections/USW-Pro-48-PoE.webp?v=1714657496',
      altText: 'Switches',
    },
    title: 'Switches',
    url: '/collections/switches',
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
