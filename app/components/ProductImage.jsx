import {useEffect, useState} from 'react';
import {MediaFile} from '@shopify/hydrogen-react';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import {motion} from 'framer-motion';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';
import {useSwipeable} from 'react-swipeable';

export function ProductImages({media, selectedVariantMedia}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaKey, setMediaKey] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);

  const selectedMedia = media[selectedMediaIndex]?.node;

  useEffect(() => {
    setMediaKey((prev) => prev + 1);
    setIsMediaLoaded(false);
  }, [selectedMediaIndex]);

  const handlePrevMedia = () => {
    setSelectedMediaIndex((prevIndex) =>
      prevIndex === 0 ? media.length - 1 : prevIndex - 1,
    );
  };

  const handleNextMedia = () => {
    setSelectedMediaIndex((prevIndex) =>
      prevIndex === media.length - 1 ? 0 : prevIndex + 1,
    );
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextMedia,
    onSwipedRight: handlePrevMedia,
  });

  return (
    <div className="product-media-container">
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
                width: 100,
                height: 100,
                crop: 'center',
              }}
            />
          </div>
        ))}
      </div>

      <div className="main-media" {...swipeHandlers}>
        {selectedMedia && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: isMediaLoaded ? 1 : 0}}
            transition={{duration: 0.3}}
          >
            <MediaFile
              key={mediaKey}
              data={selectedMedia}
              options={{
                width: 600,
                height: 600,
              }}
              onLoad={() => setIsMediaLoaded(true)}
            />
          </motion.div>
        )}
      </div>

      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedMediaIndex}
          slides={media.map(({node}) => ({src: node.previewImage?.url || ''}))}
          onIndexChange={setSelectedMediaIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
