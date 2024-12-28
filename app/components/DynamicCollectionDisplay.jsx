// DynamicCollectionDisplay.jsx
import React from 'react';
import {Link} from 'react-router-dom';
import {ProductRow} from './CollectionDisplay';

export const DynamicCollectionDisplay = ({collection, handle, title}) => {
  if (!collection || !collection.products?.nodes.length) {
    return null; // Render nothing if the collection is empty or invalid
  }

  return (
    <div className="collection-section">
      <div className="collection-header">
        <h3>{title}</h3>
        <Link to={`/collections/${handle}`} className="view-all-link">
          View All
        </Link>
      </div>
      <ProductRow products={collection.products.nodes} />
    </div>
  );
};
