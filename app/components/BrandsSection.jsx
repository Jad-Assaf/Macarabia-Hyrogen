import React, {useState, useEffect} from 'react';
import {Image} from '@shopify/hydrogen'; // Import the Shopify Image component
import '../styles/BrandsSection.css';

export default function BrandSection({brands}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger the animation when the component is mounted
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="brand-section">
      <h2>Shop By Brand</h2>
      <div
        className={`brand-grid ${isVisible ? 'visible' : 'hidden'}`}
        style={{
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        }}
      >
        {brands.map((brand, index) => (
          <a
            key={index}
            href={brand.link}
            className="brand-item"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'scale(1)' : 'scale(0.9)',
              transition: `opacity 0.5s ease ${
                index * 0.1
              }s, transform 0.5s ease ${index * 0.1}s`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              data={{
                altText: brand.name, // Use the brand name as alt text
                url: brand.image, // URL of the brand image
              }}
              width="150px" // Set a reasonable width for brand logos
              height="auto" // Set a reasonable height for brand logos
              sizes="(min-width: 45em) 10vw, 20vw" // Responsive sizes
            />
          </a>
        ))}
      </div>
    </section>
  );
}
