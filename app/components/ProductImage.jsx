import {useEffect, useState} from 'react';
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
 *   images: Array<{node: ProductFragment['images']['edges'][0]['node']}>;
 *   videos: Array<{url: string, id: string, altText?: string}>;
 * }}
 */
export function ProductImages({images, videos = [], selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaKey, setMediaKey] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  const mediaItems = [...images, ...videos.map((video) => ({node: video}))];

  useEffect(() => {
    if (selectedVariantImage) {
      const variantMediaIndex = images.findIndex(
        ({node}) => node.id === selectedVariantImage.id,
      );
      if (variantMediaIndex >= 0 && !isVariantSelected) {
        setSelectedMediaIndex(variantMediaIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantImage, images, isVariantSelected]);

  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  const selectedMedia = mediaItems[selectedMediaIndex]?.node;

  useEffect(() => {
    setMediaKey((prevKey) => prevKey + 1);
    setIsMediaLoaded(false);
  }, [selectedMediaIndex]);

  const handlePrevMedia = () => {
    setSelectedMediaIndex((prevIndex) =>
      prevIndex === 0 ? mediaItems.length - 1 : prevIndex - 1,
    );
    setIsVariantSelected(false);
  };

  const handleNextMedia = () => {
    setSelectedMediaIndex((prevIndex) =>
      prevIndex === mediaItems.length - 1 ? 0 : prevIndex + 1,
    );
    setIsVariantSelected(false);
  };

  // Swipe Handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMedia,
    onSwipedRight: handlePrevMedia,
    trackMouse: true, // Allows swiping with a mouse for desktops
  });

  return (
    <div className="product-images-container">
      {/* Thumbnails */}
      <div className="thumbContainer">
        <div className="thumbnails">
          {mediaItems.map(({node: media}, index) => (
            <div
              key={media.id}
              className={`thumbnail ${
                index === selectedMediaIndex ? 'active' : ''
              }`}
              onClick={() => setSelectedMediaIndex(index)}
            >
              {media.url ? (
                <video
                  src={media.url}
                  alt={media.altText || 'Thumbnail Video'}
                  width={80}
                  height={80}
                  muted
                  loop
                  preload="metadata"
                />
              ) : (
                <Image
                  data={media}
                  alt={media.altText || 'Thumbnail Image'}
                  aspectRatio="1/1"
                  width={80}
                  height={80}
                  loading="lazy" // Thumbnails can load lazily
                  decoding="async"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Media */}
      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{cursor: 'grab'}}
        {...swipeHandlers}
      >
        {selectedMedia?.url ? (
          <video
            key={mediaKey}
            src={selectedMedia.url}
            alt={selectedMedia.altText || 'Product Video'}
            controls
            style={{
              filter: isMediaLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
            onLoadedData={() => setIsMediaLoaded(true)}
          />
        ) : (
          <div
            style={{
              filter: isMediaLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
          >
            <Image
              key={mediaKey}
              data={selectedMedia}
              alt={selectedMedia.altText || 'Product Image'}
              sizes="(min-width: 45em) 50vw, 100vw"
              loading="eager"
              decoding="async"
              onLoad={() => setIsMediaLoaded(true)}
              loaderOptions={{
                scale: 2, // or any scale factor
              }}
            />
          </div>
        )}
        <div className="ImageArrows">
          <button
            className="prev-button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevMedia();
            }}
          >
            <LeftArrowIcon />
          </button>
          <button
            className="next-button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextMedia();
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
          index={selectedMediaIndex}
          slides={mediaItems.map(({node}) =>
            node.url ? {src: node.url, type: 'video'} : {src: node.url},
          )}
          onIndexChange={setSelectedMediaIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
