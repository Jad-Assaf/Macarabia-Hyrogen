import {useEffect, useState} from 'react';
import {MediaFile} from '@shopify/hydrogen-react';
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

/**
 * @param {{
 *   media: Array<{node: ProductFragment['media']['edges'][0]['node']}>;
 * }}
 */
export function ProductImages({media, selectedVariantMedia}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaKey, setMediaKey] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  useEffect(() => {
    if (selectedVariantMedia) {
      const variantMediaIndex = media.findIndex(
        ({node}) => node.id === selectedVariantMedia.id,
      );
      if (variantMediaIndex >= 0 && !isVariantSelected) {
        setSelectedMediaIndex(variantMediaIndex);
        setIsVariantSelected(true);
      }
    }
  }, [selectedVariantMedia, media, isVariantSelected]);

  useEffect(() => {
    setIsVariantSelected(false);
  }, [selectedVariantMedia]);

  const selectedMedia = media[selectedMediaIndex]?.node;

  useEffect(() => {
    setMediaKey((prevKey) => prevKey + 1);
    setIsMediaLoaded(false);
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

  // Swipe Handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMedia,
    onSwipedRight: handlePrevMedia,
    trackMouse: true, // Allows swiping with a mouse for desktops
  });

  return (
    <div className="product-media-container">
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
              <MediaFile
                data={mediaItem}
                options={{
                  height: 100,
                  width: 100,
                  crop: 'center',
                }}
                tabIndex="0"
              />
            </div>
          ))}
        </div>
      </div>

      <div
        className="main-media"
        onClick={() => setIsLightboxOpen(true)}
        style={{cursor: 'grab'}}
        {...swipeHandlers} // Attach swipe handlers to the main media
      >
        {selectedMedia && (
          <motion.div
            initial={{filter: 'blur(10px)'}}
            animate={{filter: isMediaLoaded ? 'blur(0px)' : 'blur(10px)'}}
            transition={{duration: 0.3}}
          >
            <MediaFile
              key={mediaKey}
              data={selectedMedia}
              options={{
                height: 570,
                width: 570,
                crop: 'center',
              }}
              tabIndex="0"
              onLoad={() => setIsMediaLoaded(true)}
            />
          </motion.div>
        )}
        <div className="MediaArrows">
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
          slides={media.map(({node}) => ({src: node.previewImage.url}))}
          onIndexChange={setSelectedMediaIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
