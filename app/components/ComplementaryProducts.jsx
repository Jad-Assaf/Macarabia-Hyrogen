import React from 'react';
import {Money} from '@shopify/hydrogen';

export function ComplementaryProducts({product}) {
  // Ensure productRecommendations exists
  const recommendations = product.productRecommendations || [];

  if (recommendations.length === 0) return null;

  return (
    <section className="complementary-products">
      <h2>Complementary Products</h2>
      <div className="complementary-products-grid">
        {recommendations.map((rec) => (
          <div key={rec.id} className="complementary-product">
            <a href={`/products/${rec.handle}`}>
              {rec.images &&
                rec.images.edges &&
                rec.images.edges.length > 0 && (
                  <img
                    src={rec.images.edges[0].node.url}
                    alt={rec.images.edges[0].node.altText || rec.title}
                    width="100"
                    height="100"
                  />
                )}
              <h3>{rec.title}</h3>
              <p>
                <Money data={rec.priceRange.minVariantPrice} />
              </p>
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}
