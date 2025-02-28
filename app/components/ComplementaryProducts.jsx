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
                  style={{width: '100%', height: 'auto'}}
                />
              )}
              <p>{prod.title}</p>
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
