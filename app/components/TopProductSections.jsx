// NewArrivals.jsx
import React, {useRef, useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import {Money} from '@shopify/hydrogen-react'; // Ensure this import matches your project setup

// SVG Icons for Navigation Buttons
const LeftArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="24"
    height="24"
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const RightArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    width="24"
    height="24"
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

// ProductItem Component with Shimmer Effect
const ProductItem = ({product}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true); // Tracks image loading
  const [isHovered, setIsHovered] = useState(false);
  const slideshowInterval = 3000; // Time for each slide in milliseconds

  const images = product.images?.nodes || [];

  // Handler for image load event
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  // Handler for clicking the image to switch
  const handleImageClick = (e) => {
    e.preventDefault(); // Prevent the link from being triggered
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
  };

  // Auto-switch images when hovered
  useEffect(() => {
    let imageTimer;

    if (isHovered) {
      imageTimer = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1,
        );
      }, slideshowInterval);
    }

    return () => clearInterval(imageTimer);
  }, [isHovered, images.length]);

  // Reset loading state when image changes
  useEffect(() => {
    setIsLoading(true);
  }, [currentImageIndex]);

  // Select the first available variant
  const selectedVariant =
    product.variants?.nodes?.find((variant) => variant.availableForSale) ||
    product.variants?.nodes?.[0] ||
    null;

  // Check if there's a discount
  const hasDiscount =
    selectedVariant?.compareAtPrice &&
    selectedVariant.compareAtPrice.amount > selectedVariant.price.amount;

  return (
    <div
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.handle}`} className="product-link">
        <div className="product-image-wrapper">
          {isLoading && <div className="product-shimmer-effect"></div>}
          {images.length > 0 && (
            <img
              src={images[currentImageIndex]?.url}
              alt={images[currentImageIndex]?.altText || product.title}
              className={`product-image ${
                isLoading ? 'image-hidden' : 'image-visible'
              }`}
              onLoad={handleImageLoad}
              onClick={handleImageClick}
              loading="lazy"
            />
          )}
        </div>
        <h4 className="product-title">{product.title}</h4>
        <div className="product-price">
          {selectedVariant?.price && <Money data={selectedVariant.price} />}
          {hasDiscount && (
            <span className="discounted-price">
              <Money data={selectedVariant.compareAtPrice} />
            </span>
          )}
        </div>
      </Link>
    </div>
  );
};

// ProductRow Component
const ProductRow = ({products}) => {
  const rowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Handle mouse down for dragging
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeft(rowRef.current.scrollLeft);
  };

  // Handle mouse leave and up to stop dragging
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  // Handle mouse move for dragging
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll-fast
    rowRef.current.scrollLeft = scrollLeft - walk;
  };

  // Scroll row by a certain distance
  const scrollRow = (distance) => {
    rowRef.current.scrollBy({left: distance, behavior: 'smooth'});
  };

  return (
    <div className="product-row-container">
      <button
        className="scroll-button prev-button"
        onClick={() => scrollRow(-600)}
      >
        <LeftArrowIcon />
      </button>
      <div
        className="collection-products-row"
        ref={rowRef}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
      >
        {products.map((product) => (
          <ProductItem key={product.id} product={product} />
        ))}
      </div>
      <button
        className="scroll-button next-button"
        onClick={() => scrollRow(600)}
      >
        <RightArrowIcon />
      </button>
    </div>
  );
};

// TopProductSections Component
export const TopProductSections = ({collection}) => {
  return (
    <div className="collection-section">
      <div className="collection-header">
        <h3>New Arrivals</h3>
        <Link to="/collections/new-arrivals" className="view-all-link">
          View All
        </Link>
      </div>
      <ProductRow products={collection.products.nodes} />
    </div>
  );
};
