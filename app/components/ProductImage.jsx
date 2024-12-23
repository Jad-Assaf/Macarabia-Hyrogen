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

/**
 * @param {{
 *   images: Array<{node: ProductFragment['media']['edges'][0]['node']}>;
 *   selectedVariantImage?: { id: string };
 * }}
 */
export function ProductImages({images, selectedVariantImage}) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageKey, setImageKey] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  useEffect(() => {
    if (selectedVariantImage) {
      const variantImageIndex = images.findIndex(
        (media) =>
          media.__typename === 'MediaImage' &&
          media.id === selectedVariantImage.id,
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

  const selectedMedia = images[selectedImageIndex];

  useEffect(() => {
    setImageKey((prevKey) => prevKey + 1);
    setIsImageLoaded(false);
  }, [selectedImageIndex]);

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

  const renderMedia = (media) => {
    if (media.__typename === 'Video') {
      return (
        <video controls>
          {media.sources.map((source) => (
            <source key={source.url} src={source.url} type={source.mimeType} />
          ))}
          Your browser does not support the video tag.
        </video>
      );
    } else if (media.__typename === 'ExternalVideo') {
      const videoId = new URL(media.embeddedUrl).searchParams.get('v');
      return (
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube Video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      );
    } else if (media.__typename === 'MediaImage') {
      return (
        <Image
          data={media.image}
          alt={media.image.altText || 'Product Media'}
          aspectRatio="1/1"
          width={100}
          height={100}
          loading="lazy"
        />
      );
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextImage,
    onSwipedRight: handlePrevImage,
    trackMouse: true,
  });

  return (
    <div className="product-images-container">
      <div className="thumbContainer">
        <div className="thumbnails">
          {images.map((media, index) => (
            <div
              key={media.id}
              className={`thumbnail ${
                index === selectedImageIndex ? 'active' : ''
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              {renderMedia(media)}
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
        {selectedMedia && (
          <motion.div
            initial={{filter: 'blur(10px)'}}
            animate={{filter: isImageLoaded ? 'blur(0px)' : 'blur(10px)'}}
            transition={{duration: 0.3}}
          >
            {renderMedia(selectedMedia)}
          </motion.div>
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

      {isLightboxOpen && (
        <Lightbox
          open={isLightboxOpen}
          close={() => setIsLightboxOpen(false)}
          index={selectedImageIndex}
          slides={images.map((media) =>
            media.__typename === 'Video' || media.__typename === 'ExternalVideo'
              ? {
                  src:
                    media.__typename === 'Video'
                      ? media.sources[0].url
                      : media.embeddedUrl,
                  type: 'video',
                }
              : {src: media.image.url},
          )}
          onIndexChange={setSelectedImageIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
