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
 *   images: Array<{node: ProductFragment['images']['edges'][0]['node']}>;
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

  const selectedImage = images[selectedImageIndex]?.node;

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

  const isVideo = (url) =>
    /\.(mp4|webm)$/i.test(url) || url.includes('youtube.com');

  // Swipe Handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNextImage,
    onSwipedRight: handlePrevImage,
    trackMouse: true, // Allows swiping with a mouse for desktops
  });

  return (
    <div className="product-images-container">
      <div className="thumbContainer">
        <div className="thumbnails">
          {images.map(({node: image}, index) => (
            <div
              key={image.id}
              className={`thumbnail ${
                index === selectedImageIndex ? 'active' : ''
              }`}
              onClick={() => setSelectedImageIndex(index)}
            >
              {isVideo(image.url) ? (
                <div className="video-thumbnail">Video</div> // Customize if needed
              ) : (
                <Image
                  data={image}
                  alt={image.altText || 'Thumbnail Image'}
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
        {...swipeHandlers} // Attach swipe handlers to the main image
      >
        {selectedImage && isVideo(selectedImage.url) ? (
          selectedImage.url.includes('youtube.com') ? (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${new URL(
                selectedImage.url,
              ).searchParams.get('v')}`}
              title="YouTube Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          ) : (
            <video controls>
              <source src={selectedImage.url} type="video/mp4" />
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
              data={selectedImage}
              alt={selectedImage.altText || 'Product Image'}
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
          slides={images.map(({node}) =>
            isVideo(node.url)
              ? {src: node.url, type: 'video'}
              : {src: node.url},
          )}
          onIndexChange={setSelectedImageIndex}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
