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
 * Renders a carousel for either images or external videos (e.g. YouTube).
 * We still call it "ProductImages" for simplicity, but it handles multiple media types.
 */
export function ProductImages({media, selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  // If a specific variant image is chosen, find its index in the media array
  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = media.findIndex(({node}) => {
        // Check if it's a MediaImage and if IDs match
        return (
          node.__typename === 'MediaImage' &&
          node.image?.id === selectedVariantImage.id
        );
      });
      if (variantImageIndex >= 0 && !isVariantSelected) {
        setSelectedIndex(variantImageIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantImage, media, isVariantSelected]);

  // Reset the "variant selected" flag if selectedVariantImage changes
  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  // Whenever selectedIndex changes, trigger a key change to re-render
  const selectedMedia = media[selectedIndex]?.node;

  useEffect(() => {
    setImageKey((prevKey) => prevKey + 1);
    setIsImageLoaded(false);
  }, [selectedIndex]);

  const handlePrevImage = () => {
    setSelectedIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1,
    );
    setIsVariantSelected(false);
  };

  const handleNextImage = () => {
    setSelectedIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1,
    );
    setIsVariantSelected(false);
  };

  // Swipe Handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextImage,
    onSwipedRight: handlePrevImage,
    trackMouse: true,
  });

  return (
    <div className="product-images-container">
      {/* Thumbnails */}
      <div className="thumbContainer">
        <div className="thumbnails">
          {media.map(({node}, index) => {
            const isActive = index === selectedIndex;
            let thumbSrc = '';
            let altText = node.alt || 'Thumbnail';
            let isVideo = false; // Flag to determine if the media is a video

            if (node.__typename === 'MediaImage') {
              thumbSrc = node.image?.url;
              altText = node.image?.altText || altText;
            } else if (node.__typename === 'ExternalVideo') {
              // For a YouTube external video, there's no "thumbnail" by default in the Storefront API
              // You could fetch it from node.embedUrl if you want a custom YT thumbnail
              thumbSrc = 'https://img.icons8.com/color/480/youtube-play.png'; // a fallback icon
              isVideo = true;
            } else if (node.__typename === 'Video') {
              thumbSrc = 'https://img.icons8.com/fluency/480/video.png'; // a fallback icon
              isVideo = true;
            }

            // Define inline styles conditionally for video thumbnails
            const thumbnailStyle = isVideo
              ? {background: '#0c0c0c', padding: '9px'}
              : {};

            return (
              <div
                key={node.id || index}
                className={`thumbnail ${isActive ? 'active' : ''}`}
                style={thumbnailStyle} // Apply styles here
                onClick={() => setSelectedIndex(index)}
              >
                {thumbSrc ? (
                  <img
                    src={thumbSrc}
                    alt={altText}
                    width={80}
                    height={80}
                    loading="lazy"
                  />
                ) : (
                  <div>Media</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Media */}
      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{cursor: 'grab'}}
        {...swipeHandlers}
      >
        {selectedMedia && (
          <div
            style={{
              filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
          >
            {/* If it's an IMAGE */}
            {selectedMedia.__typename === 'MediaImage' && (
              <Image
                key={imageKey}
                data={selectedMedia.image}
                alt={selectedMedia.image.altText || 'Product Image'}
                sizes="(min-width: 45em) 50vw, 100vw"
                loading="eager"
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                loaderOptions={{scale: 2}}
              />
            )}

            {/* If it's an EXTERNAL VIDEO (YouTube, Vimeo, etc.) */}
            {selectedMedia.__typename === 'ExternalVideo' && (
              <iframe
                key={imageKey}
                width="100%"
                height="auto"
                src={selectedMedia.embedUrl}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsImageLoaded(true)}
              />
            )}

            {/* If it's a Video (hosted on Shopify) */}
            {selectedMedia.__typename === 'Video' &&
              selectedMedia.sources?.[0] && (
                <video
                  key={imageKey}
                  width="100%"
                  height="auto"
                  controls
                  onLoadedData={() => setIsImageLoaded(true)}
                >
                  <source
                    src={selectedMedia.sources[0].url}
                    type={selectedMedia.sources[0].mimeType || 'video/mp4'}
                  />
                  Your browser does not support the video tag.
                </video>
              )}

            {/* If it's a 3D model or something else, handle as needed */}
            {selectedMedia.__typename === 'Model3d' && (
              <div style={{textAlign: 'center'}}>
                <p>3D Model preview not implemented</p>
              </div>
            )}
          </div>
        )}
        {/* Left/Right Arrows */}
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

      {/* Lightbox (click to enlarge) */}
      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedIndex}
          slides={media.map(({node}) => {
            // For the Lightbox slides, we need a "src"
            if (node.__typename === 'MediaImage') {
              return {src: node.image.url};
            } else if (node.__typename === 'ExternalVideo') {
              // Lightbox typically expects images, but we can embed an iframe
              // For an actual lightbox video experience, you'd use an inline embed or skip it
              return {src: node.embedUrl};
            } else if (node.__typename === 'Video') {
              // Possibly just link the MP4
              const vidSource = node.sources?.[0]?.url;
              return {src: vidSource || ''};
            } else if (node.__typename === 'Model3d') {
              // Or you can skip
              return {src: ''};
            }
            return {src: ''};
          })}
          onIndexChange={setSelectedIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
