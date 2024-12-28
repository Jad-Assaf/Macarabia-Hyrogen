// NewArrivals.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { ProductRow } from './CollectionDisplay';

export const TopProductSections = ({ collection }) => {
  if (!collection) return null;

  const { title, handle, products } = collection;
  const productNodes = products?.nodes || [];

  return (
    <div className="collection-section">
      <div className="collection-header">
        <h3>{title}</h3>
        <Link to={`/collections/${handle}`} className="view-all-link">
          View All
        </Link>
      </div>

      {/* Render your product row */}
      <ProductRow products={productNodes} />
    </div>
  );
};
