// ComplementaryProducts.jsx
import React from 'react';
import {Money} from '@shopify/hydrogen';

// Define your query to fetch complementary products
export const COMPLEMENTARY_PRODUCTS_QUERY = `#graphql
  query GetComplementaryProducts($productId: ID!) {
    productRecommendations(productId: $productId, intent: COMPLEMENTARY) {
      id
      title
      handle
      images(first: 1) {
        edges {
          node {
            url
            altText
          }
        }
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
    }
  }
`;

export function ComplementaryProducts({productId, complementaryProducts}) {
  // If you’re loading via a loader, you might have already fetched complementaryProducts,
  // or you could fetch them inside this component with a custom hook.
  // Here we assume complementaryProducts is passed as a prop.

  if (!complementaryProducts || complementaryProducts.length === 0) return null;

  return (
    <section className="complementary-products">
      <h2>Complementary Products</h2>
      <ul className="complementary-products-list">
        {complementaryProducts.map((prod) => (
          <li key={prod.id} className="complementary-product">
            <a href={`/products/${prod.handle}`}>
              {prod.images?.edges?.[0]?.node?.url && (
                <img
                  src={prod.images.edges[0].node.url}
                  alt={prod.images.edges[0].node.altText || prod.title}
                  width="100"
                  height="100"
                />
              )}
              <h3>{prod.title}</h3>
              <p>
                <Money data={prod.priceRange.minVariantPrice} />
              </p>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
