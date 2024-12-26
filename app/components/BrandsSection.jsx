import React from 'react';
import { useInView } from 'react-intersection-observer'; // Import useInView
import { Image } from '@shopify/hydrogen'; // Import the Shopify Image component
import '../styles/BrandsSection.css';

export default function BrandSection({ brands }) {
  const { ref, inView } = useInView({
    triggerOnce: true, // Trigger the animation only once
    threshold: 0.1, // 10% of the element must be in view
  });

  return (
    <section className="brand-section" ref={ref}>
      <h2>Shop By Brand</h2>
      <div className={`brand-grid ${inView ? 'visible' : 'hidden'}`}>
        {brands.map((brand, index) => (
          <a
            key={index}
            href={brand.link}
            className="brand-item"
            style={{
              opacity: inView ? 1 : 0,
              transform: inView ? 'scale(1)' : 'scale(0.9)',
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
              height={auto} // Set a reasonable height for brand logos
              sizes="(min-width: 45em) 10vw, 20vw" // Responsive sizes
            />
          </a>
        ))}
      </div>
    </section>
  );
}
