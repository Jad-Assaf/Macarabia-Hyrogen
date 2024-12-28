// TopProductSections.jsx
import React from 'react';
import {Link} from 'react-router-dom';
import {ProductRow} from './CollectionDisplay';

// 1) Import the MenuSlider component
import {MenuSlider} from './MenuSlider';

export const TopProductSections = ({collection}) => {
  if (!collection) return null;

  const {title, handle, products} = collection;
  const productNodes = products?.nodes || [];

  return (
    <div className="collection-section">
      <div className="collection-header">
        <h3>{title}</h3>
        <Link to={`/collections/${handle}`} className="view-all-link">
          View All
        </Link>
      </div>

      {/* 
        Existing product row for this collection.
        You can keep or remove this depending on whether you want both the row and the slider.
      */}
      <ProductRow products={productNodes} />

      {/* 2) Render the MenuSlider, passing in the entire collection */}
      <MenuSlider collection={collection} />
    </div>
  );
};
