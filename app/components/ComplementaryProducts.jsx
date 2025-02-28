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
  // For a simple fade-in animation, we'll simulate "isVisible" via state.
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true);
  }, []);

  if (!complementaryProducts || complementaryProducts.length === 0) return null;

  return (
    <section className="complementary-products">
      <h2>Complementary Products</h2>
      <div
        className="complementary-products-container"
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '10px',
          overflowX: 'auto',
          padding: '10px',
          scrollBehavior: 'smooth',
        }}
      >
        {complementaryProducts.map((product) => (
          <div
            key={product.id}
            className="product-item"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
              flex: '0 0 100px', // Each product takes up 100px width
            }}
          >
            <div
              className="product-card"
              style={{
                filter: isVisible ? 'blur(0px)' : 'blur(10px)',
                transition: 'filter 0.5s ease, opacity 0.5s ease',
              }}
            >
              <Link to={`/products/${encodeURIComponent(product.handle)}`}>
                <Image
                  // If your product data has a featuredImage field, use that;
                  // otherwise, fall back to the first image in product.images.edges.
                  data={
                    product.featuredImage || product.images?.edges?.[0]?.node
                  }
                  aspectratio="1/1"
                  sizes="(min-width: 45em) 20vw, 40vw"
                  srcSet={
                    product.images?.edges?.[0]?.node?.url
                      ? `${product.images.edges[0].node.url}?width=300&quality=30 300w,
                         ${product.images.edges[0].node.url}?width=600&quality=30 600w,
                         ${product.images.edges[0].node.url}?width=1200&quality=30 1200w`
                      : ''
                  }
                  alt={
                    product.images?.edges?.[0]?.node?.altText || product.title
                  }
                  width="100px"
                  height="100px"
                />
                <div
                  className="product-title"
                  style={{fontSize: '0.8rem', marginTop: '5px'}}
                >
                  {product.title}
                </div>
                <div className="product-price" style={{fontSize: '0.8rem'}}>
                  {product.priceRange?.minVariantPrice?.currencyCode}&nbsp;
                  {product.priceRange?.minVariantPrice?.amount}
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
