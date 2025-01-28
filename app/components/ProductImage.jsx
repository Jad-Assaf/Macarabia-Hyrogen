// ProductImages.jsx
import { useEffect, useState } from 'react';
import { Image } from '@shopify/hydrogen';
import Lightbox from 'yet-another-react-lightbox';
import Fullscreen from 'yet-another-react-lightbox/plugins/fullscreen';
import 'yet-another-react-lightbox/styles.css';
import '../styles/ProductImage.css';
import { useSwipeable } from 'react-swipeable';

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
 * Utility function to extract YouTube video ID from a URL
 * Supports both standard and shortened YouTube URLs
 * Returns null if not a YouTube URL
 * @param {string} url 
 * @returns {string|null}
 */
function getYouTubeVideoId(url) {
  const regex = /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

/**
 * Utility function to get YouTube thumbnail URL
 * @param {string} videoId 
 * @returns {string}
 */
function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/**
 * @param {{
 *   images: Array<{node: ProductFragment['images']['edges'][0]['node']}>;
 *   videos: Array<{url: string, id: string, altText?: string}>;
 *   selectedVariantImage?: {id: string};
 * }}
 */
export function ProductImages({ images, videos = [], selectedVariantImage }) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [mediaKey, setMediaKey] = useState(0);
  const [isMediaLoaded, setIsMediaLoaded] = useState(false);
  const [isVariantSelected, setIsVariantSelected] = useState(false);

  // Combine images and videos while maintaining their distinction
  const mediaItems = [
    ...images.map(({ node }) => ({ type: 'image', node })),
    ...videos.map(({ url, id, altText }) => {
      const youtubeId = getYouTubeVideoId(url);
      return {
        type: youtubeId ? 'youtube' : 'video',
        node: { url, id, altText, youtubeId },
      };
    }),
  ];

  useEffect(() => {
    if (selectedVariantImage) {
      const variantMediaIndex = images.findIndex(
        ({ node }) => node.id === selectedVariantImage.id,
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
          {mediaItems.map(({ type, node: media }, index) => {
            // Determine thumbnail content
            let thumbnailContent;
            if (type === 'youtube') {
              // Use YouTube thumbnail
              thumbnailContent = (
                <img
                  src={getYouTubeThumbnail(media.youtubeId)}
                  alt={media.altText || 'YouTube Video Thumbnail'}
                  width={80}
                  height={80}
                />
              );
            } else if (type === 'video') {
              // Use a generic video thumbnail or an icon
              thumbnailContent = (
                <video
                  src={media.url}
                  alt={media.altText || 'Thumbnail Video'}
                  width={80}
                  height={80}
                  muted
                  loop
                  preload="metadata"
                />
              );
            } else {
              // Image thumbnail
              thumbnailContent = (
                <Image
                  data={media}
                  alt={media.altText || 'Thumbnail Image'}
                  aspectRatio="1/1"
                  width={80}
                  height={80}
                  loading="lazy" // Thumbnails can load lazily
                  decoding="async"
                />
              );
            }

            return (
              <div
                key={media.id}
                className={`thumbnail ${
                  index === selectedMediaIndex ? 'active' : ''
                }`}
                onClick={() => setSelectedMediaIndex(index)}
                style={{ position: 'relative' }}
              >
                {thumbnailContent}
                {type === 'youtube' && (
                  <div className="play-icon-overlay">
                    {/* Play Icon Overlay for YouTube Videos */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="none"
                      width="24"
                      height="24"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                )}
                {type === 'video' && (
                  <div className="play-icon-overlay">
                    {/* Play Icon Overlay for Direct Videos */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      stroke="none"
                      width="24"
                      height="24"
                    >
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
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
        style={{ cursor: 'grab' }}
        {...swipeHandlers}
      >
        {mediaItems[selectedMediaIndex]?.type === 'youtube' ? (
          <div className="youtube-iframe-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              key={mediaKey}
              title={selectedMedia.altText || 'YouTube Video'}
              src={`https://www.youtube.com/embed/${selectedMedia.youtubeId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                filter: isMediaLoaded ? 'blur(0px)' : 'blur(10px)',
                transition: 'filter 0.3s ease',
              }}
              onLoad={() => setIsMediaLoaded(true)}
            ></iframe>
          </div>
        ) : mediaItems[selectedMediaIndex]?.type === 'video' ? (
          <video
            key={mediaKey}
            src={selectedMedia.url}
            controls
            style={{
              width: '100%',
              height: 'auto',
              filter: isMediaLoaded ? 'blur(0px)' : 'blur(10px)',
              transition: 'filter 0.3s ease',
            }}
            onLoadedData={() => setIsMediaLoaded(true)}
          >
            Sorry, your browser doesn't support embedded videos.
          </video>
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
                scale: 2,
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
            aria-label="Previous Media"
          >
            <LeftArrowIcon />
          </button>
          <button
            className="next-button"
            onClick={(e) => {
              e.stopPropagation();
              handleNextMedia();
            }}
            aria-label="Next Media"
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
          slides={mediaItems.map(({ type, node }) => {
            if (type === 'youtube') {
              return {
                type: 'html',
                html: `
                  <div style="position: relative; padding-bottom: 56.25%; height: 0;">
                    <iframe 
                      src="https://www.youtube.com/embed/${node.youtubeId}?autoplay=1" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen 
                      style="position:absolute; top:0; left:0; width:100%; height:100%;">
                    </iframe>
                  </div>
                `,
              };
            } else if (type === 'video') {
              return {
                type: 'video',
                src: node.url,
                video: {
                  attributes: {
                    controls: true,
                    autoPlay: true,
                  },
                },
              };
            } else {
              return { src: node.url };
            }
          })}
          render={{
            slide: ({ slide }) => {
              if (slide.type === 'html') {
                return <div dangerouslySetInnerHTML={{ __html: slide.html }} />;
              } else if (slide.type === 'video') {
                return (
                  <video
                    src={slide.src}
                    controls
                    autoPlay
                    style={{ width: '100%', height: 'auto' }}
                  >
                    Sorry, your browser doesn't support embedded videos.
                  </video>
                );
              } else {
                return <Image src={slide.src} alt="" />;
              }
            },
          }}
          plugins={[Fullscreen]}
        />
      )}
    </div>
  );
}

/** @typedef {import('storefrontapi.generated').ProductFragment} ProductFragment */
