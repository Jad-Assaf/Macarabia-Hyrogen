import React, {Suspense, useEffect, useRef, useState} from 'react';
import {Link} from '@remix-run/react';
import {Money, Image} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import CollectionRows from './CollectionRows'; // Standard import for CollectionRows

// Truncate text to fit within the given max word count
export function truncateText(text, maxWords) {
  if (!text || typeof text !== 'string') {
    return ''; // Return an empty string if text is undefined or not a string
  }
  const words = text.split(' ');
  return words.length > maxWords
    ? words.slice(0, maxWords).join(' ') + '...'
    : text;
}

// Simplified CollectionDisplay
export const CollectionDisplay = React.memo(({menuCollections}) => {
  return (
    <div className="collections-container">
      <CollectionRows menuCollections={menuCollections} />
    </div>
  );
});

export function ProductRow({products}) {
  const rowRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeft(rowRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    rowRef.current.scrollLeft = scrollLeft - walk;
  };

  const scrollRow = (distance) => {
    rowRef.current.scrollBy({left: distance, behavior: 'smooth'});
  };

  return (
      <><button className="home-prev-button" onClick={() => scrollRow(-600)}>
          <LeftArrowIcon />
      </button><div
          className="collection-products-row"
          ref={rowRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
      >
              {products.map((product, index) => (
                  <ProductItem key={product.id} product={product} index={index} />
              ))}
          </div><button className="home-next-button" onClick={() => scrollRow(600)}>
              <RightArrowIcon />
          </button></>
  );
}

const LeftArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
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
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

export function ProductItem({product, index}) {
  const ref = useRef(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // State for loading
  const slideshowInterval = 3000; // Time for each slide

  const images = product.images?.nodes || [];

  // Handle image click to switch images
  const handleImageClick = (e) => {
    e.preventDefault(); // Prevent the link from being triggered
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
  };

  // Handle image load event
  const handleImageLoad = () => {
    setIsLoading(false);
  };

  useEffect(() => {
    let imageTimer, progressTimer;

    if (isHovered) {
      // Image slideshow timer
      imageTimer = setInterval(() => {
        setCurrentImageIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1,
        );
      }, slideshowInterval);

      // Progress bar timer
      progressTimer = setInterval(() => {
        setProgress((prev) =>
          prev >= 100 ? 0 : prev + 100 / (slideshowInterval / 100),
        );
      }, 100);
    } else {
      setProgress(0); // Reset progress when not hovered
    }

    return () => {
      clearInterval(imageTimer);
      clearInterval(progressTimer);
    };
  }, [isHovered, images.length]);

  useEffect(() => {
    setProgress(0); // Reset progress when the current image changes
    setIsLoading(true); // Reset loading state for new image
  }, [currentImageIndex]);

  const selectedVariant =
    product.variants?.nodes?.find((variant) => variant.availableForSale) ||
    product.variants?.nodes?.[0] ||
    null;

  const hasDiscount =
    selectedVariant?.compareAtPrice &&
    selectedVariant.compareAtPrice.amount > selectedVariant.price.amount;

  return (
    <div
      ref={ref}
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.handle}`}>
        {images.length > 0 && (
          <div className="product-slideshow" style={styles.slideshow}>
            <div className="product-image-wrapper" style={styles.imageWrapper}>
              {isLoading && (
                <div className="product-shimmer-effect"></div> // Shimmer Placeholder
              )}
              <img
                src={images[currentImageIndex]?.url}
                alt={images[currentImageIndex]?.altText || 'Product Image'}
                sizes="(min-width: 45em) 20vw, 40vw"
                srcSet={`${images[currentImageIndex]?.url}?width=300&quality=7 300w,
                        ${images[currentImageIndex]?.url}?width=600&quality=7 600w,
                        ${images[currentImageIndex]?.url}?width=1200&quality=7 1200w`}
                width="180px"
                height="180px"
                loading="lazy"
                style={{
                  ...styles.image,
                  opacity: isLoading ? 0 : 1, // Hide image until loaded
                  transition: 'opacity 0.3s ease-in-out',
                }}
                className={`product-slideshow-image ${
                  isLoading ? '' : 'image-loaded'
                }`}
                onClick={handleImageClick} // Click to switch images
                onLoad={handleImageLoad} // Image load handler
              />
            </div>
            <div
              className="product-slideshow-progress-bar"
              style={styles.progressBar}
            >
              <div
                className="product-slideshow-progress"
                style={{
                  ...styles.progress,
                  width: `${progress}%`,
                }}
              ></div>
            </div>
            {/* Indicator Dots */}
            <div
              className="product-slideshow-dots"
              style={styles.dotsContainer}
            >
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`product-slideshow-dot ${
                    currentImageIndex === idx ? 'active' : ''
                  }`}
                  style={{
                    ...styles.dot,
                    backgroundColor:
                      currentImageIndex === idx ? '#000' : '#e0e0e0',
                  }}
                  onClick={() => setCurrentImageIndex(idx)}
                ></div>
              ))}
            </div>
          </div>
        )}
        <h4 className="product-title">{product.title}</h4>
        <div className="product-price">
          {selectedVariant?.price && <Money data={selectedVariant.price} />}
          {hasDiscount && (
            <small className="discountedPrice">
              <Money data={selectedVariant.compareAtPrice} />
            </small>
          )}
        </div>
      </Link>

      {/* Add to Cart Button */}
      {/* Uncomment and adjust as needed
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        onClick={() => {
          if (product.variants?.nodes?.length > 1) {
            window.location.href = `/products/${product.handle}`;
          } else {
            // Trigger cart logic
          }
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  product: {
                    ...product,
                    selectedVariant,
                    handle: product.handle,
                  },
                },
              ]
            : []
        }
      >
        {!selectedVariant?.availableForSale
          ? 'Sold out'
          : product.variants?.nodes?.length > 1
          ? 'Select Options'
          : 'Add to cart'}
      </AddToCartButton>
      */}
    </div>
  );
}

const styles = {
  imageWrapper: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  slideshow: {
    position: 'relative',
    width: '100%',
    height: 'auto',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
  },
  progressBar: {
    position: 'absolute',
    bottom: '5px',
    left: '10%',
    width: '80%',
    height: '3px',
    backgroundColor: '#e0e0e0',
    borderRadius: '30px',
  },
  progress: {
    height: '100%',
    backgroundColor: '#000',
    transition: 'width 0.1s linear',
    borderRadius: '30px',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: '15px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '8px',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};
