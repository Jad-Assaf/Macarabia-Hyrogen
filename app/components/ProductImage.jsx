import {useEffect, useState} from 'react';
import {Image} from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import {motion} from 'framer-motion';
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

export function ProductImages({media, selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  useEffect(() => {
    if (selectedVariantImage) {
      const variantMediaIndex = media.findIndex(
        ({node}) =>
          node.__typename === 'MediaImage' &&
          node.image.id === selectedVariantImage.id,
      );
      if (variantMediaIndex >= 0 && !isVariantSelected) {
        setSelectedMediaIndex(variantMediaIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantImage, media, isVariantSelected]);

  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantImage]);

  const selectedMedia = media[selectedMediaIndex]?.node;

  useEffect(() => {
    setImageKey((prevKey) => prevKey + 1);
    setIsImageLoaded(false);
  }, [selectedMediaIndex]);

  const handlePrevMedia = () => {
    setSelectedMediaIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1,
    );
    setIsVariantSelected(false);
  };

  const handleNextMedia = () => {
    setSelectedMediaIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1,
    );
    setIsVariantSelected(false);
  };

  const isVideo = (mediaItem) =>
    mediaItem.__typename === 'Video' ||
    mediaItem.__typename === 'ExternalVideo';

  // Swipe Handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMedia,
    onSwipedRight: handlePrevMedia,
    trackMouse: true,
  });

  return (
    <div className="product-images-container">
      <div className="thumbContainer">
        <div className="thumbnails">
          {media.map(({node: mediaItem}, index) => (
            <div
              key={mediaItem.id}
              className={`thumbnail ${
                index === selectedMediaIndex ? 'active' : ''
              }`}
              onClick={() => setSelectedMediaIndex(index)}
            >
              {isVideo(mediaItem) ? (
                <div className="video-thumbnail">Video</div>
              ) : (
                <Image
                  data={mediaItem.image}
                  alt={mediaItem.image.altText || 'Thumbnail Image'}
                  aspectRatio="1/1"
                  width={100}
                  height={100}
                  loading="lazy"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        className="main-image"
        onClick={() => setIsLightboxOpen(true)}
        style={{cursor: 'grab'}}
        {...swipeHandlers}
      >
        {selectedMedia && isVideo(selectedMedia) ? (
          selectedMedia.__typename === 'ExternalVideo' ? (
            <iframe
              width="100%"
              height="100%"
              src={selectedMedia.embeddedUrl}
              title="External Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video controls>
              <source
                src={selectedMedia.sources[0].url}
                type={selectedMedia.sources[0].mimeType}
              />
              Your browser does not support the video tag.
            </video>
          )
        ) : (
          <motion.div
            initial={{filter: 'blur(10px)'}}
            animate={{filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)'}}
            transition={{duration: 0.3}}
          >
            <Image
              key={imageKey}
              data={selectedMedia.image}
              alt={selectedMedia.image.altText || 'Product Image'}
              aspectRatio="1/1"
              sizes="(min-width: 45em) 50vw, 100vw"
              width="570px"
              height="570px"
              loading="eager"
              onLoad={() => setIsImageLoaded(true)}
            />
          </motion.div>
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

      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedMediaIndex}
          slides={media.map(({node}) =>
            isVideo(node)
              ? {src: node.embeddedUrl || node.sources[0].url, type: 'video'}
              : {src: node.image.url},
          )}
          onIndexChange={setSelectedMediaIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
