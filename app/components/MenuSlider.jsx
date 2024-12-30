import React from 'react';
import {useInView} from 'react-intersection-observer';

/**
 * MenuSlider component
 * Shows a slider of products in the current collection using intersection observer
 */
export function MenuSlider({collection}) {
  // If your "collection" doesn’t have products, simply return null
  if (!collection?.products?.nodes?.length) return null;

  const productNodes = collection.products.nodes;

  return (
    <div className="menu-slider-container">
      {productNodes.map((product, index) => {
        const [ref, inView] = useInView({triggerOnce: true});

        return (
          <div className="animated-menu-item" ref={ref} key={product.id}>
            {inView && (
              <div>
                {/* 
                  This is where you render your product data.
                  You could replace this with any component that displays
                  the product, e.g. <CollectionItem />, <ProductCard />, etc.
                */}
                <h4>{product.title}</h4>
                {/* Additional product info, price, images, etc. */}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}