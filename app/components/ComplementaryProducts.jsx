import React, {useState, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';

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

export function ComplementaryProducts({complementaryProducts}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  if (!complementaryProducts || complementaryProducts.length === 0) return null;

  return (
    <section className="complementary-products">
      <h2>Frequently Bought Together</h2>
      <div className="complementary-products-container">
        {complementaryProducts.map((product) => (
          <div
            key={product.id}
            className={`complementary-product-item ${
              isVisible ? 'visible' : ''
            }`}
          >
            <div
              className={`complementary-product-card ${
                isVisible ? 'visible' : ''
              }`}
            >
              <Link to={`/products/${encodeURIComponent(product.handle)}`}>
                <Image
                  data={
                    product.featuredImage || product.images?.edges?.[0]?.node
                  }
                  aspectratio="1/1"
                  sizes="(min-width: 45em) 20vw, 40vw"
                  srcSet={
                    product.images?.edges?.[0]?.node?.url
                      ? `${product.images.edges[0].node.url}?width=300&quality=15 300w,
                         ${product.images.edges[0].node.url}?width=600&quality=15 600w,
                         ${product.images.edges[0].node.url}?width=1200&quality=15 1200w`
                      : ''
                  }
                  alt={
                    product.images?.edges?.[0]?.node?.altText || product.title
                  }
                  width="150px"
                  height="150px"
                />
                <div className="complementary-product-title">
                  {product.title}
                </div>
                <div className="complementary-product-price">
                  ${product.priceRange?.minVariantPrice?.amount}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
