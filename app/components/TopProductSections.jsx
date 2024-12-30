// TopProductSections.jsx
import React from 'react';
import {Link} from 'react-router-dom';
import {ProductRow} from './CollectionDisplay';
import {useInView} from 'react-intersection-observer';

export const TopProductSections = ({collection}) => {
  // Initialize the useInView hook
  const {ref, inView} = useInView({
    threshold: 0.3, // Trigger when 10% of the component is visible
    triggerOnce: true, // Trigger only once
  });

  // Define the styles for the fade-in effect
  const sectionStyle = {
    opacity: inView ? 1 : 0, // Opacity transitions from 0 to 1
    transition: 'opacity 0.5s ease-in', // 0.5s fade-in animation
  };

  return (
    <div className="collection-section" ref={ref} style={sectionStyle}>
      <div className="collection-header">
        <h3>{collection.title}</h3>
        <Link
          to={`/collections/${collection.handle}`}
          className="view-all-link"
        >
          View All
        </Link>
      </div>
      <ProductRow products={collection.products.nodes} />
    </div>
  );
};
