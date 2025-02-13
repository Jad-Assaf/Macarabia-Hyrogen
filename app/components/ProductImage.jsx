import {useEffect, useState, useRef} from 'react';
import {Image} from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';
import {useSwipeable} from 'react-swipeable';

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

/**
 * @param {{
 *   images: Array<{node: {id: string; url: string; altText?: string; width?: number; height?: number}}>;
 *   selectedVariantImage?: {id: string; url: string;} | null;
 * }}
 */
export function ProductImages({images, selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  // Refs to scroll the active thumbnail into view
  const thumbnailRefs = useRef([]);
  thumbnailRefs.current = [];

  // Whenever variant's image changes, locate & display it
  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = images.findIndex(
        ({node}) => node.id === selectedVariantImage.id,
      );
      if (variantImageIndex >= 0 && !isVariantSelected) {
        setSelectedImageIndex(variantImageIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantImage, images, isVariantSelected]);

  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  // Re-render the image on index change
  useEffect(() => {
    setImageKey((prevKey) => prevKey + 1);
    setIsImageLoaded(false);
  }, [selectedImageIndex]);

  // Scroll the thumbnails so the active one is visible
  useEffect(() => {
    if (thumbnailRefs.current[selectedImageIndex]) {
      thumbnailRefs.current[selectedImageIndex].scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center',
      });
    }
  }, [selectedImageIndex]);

  // Keyboard events: left arrow => prev, right arrow => next
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [images]); // No need for a wide dependency list; images reference won't change often

  const handlePrevImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );
    setIsVariantSelected(false);
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
    setIsVariantSelected(false);
  };

  // Swipe Handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextImage,
    onSwipedRight: handlePrevImage,
    trackMouse: true,
  });

  const selectedImage = images[selectedImageIndex]?.node;

  return (
    <div className="product-images-container">
      {/* Thumbnails */}
      <div className="thumbContainer">
        <div className="thumbnails">
          {images.map(({node: image}, index) => (
            <div
              key={image.id}
              className={`thumbnail ${
                index === selectedImageIndex ? 'active' : ''
              }`}
              ref={(el) => (thumbnailRefs.current[index] = el)}
              onClick={() => setSelectedImageIndex(index)}
            >
              <Image
                data={image}
                alt={image.altText || 'Thumbnail Image'}
                aspectratio="1/1"
                width={80}
                height={80}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main Image */}
      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{cursor: 'grab'}}
        {...swipeHandlers}
      >
        {selectedImage && (
          <div
            style={{
              filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
          >
            <Image
              key={imageKey}
              data={selectedImage}
              alt={selectedImage.altText || 'Product Image'}
              sizes="(min-width: 45em) 50vw, 100vw"
              loading="eager"
              decoding="async"
              onLoad={() => setIsImageLoaded(true)}
            />
          </div>
        )}
        <div className="ImageArrows">
          <button
            className="prev-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevImage();
            }}
          >
            <LeftArrowIcon />
          </button>
          <button
            className="next-button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextImage();
            }}
          >
            <RightArrowIcon />
          </button>
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedImageIndex}
          slides={images.map(({node}) => ({src: node.url}))}
          onIndexChange={setSelectedImageIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
