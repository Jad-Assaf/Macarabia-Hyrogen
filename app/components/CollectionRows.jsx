import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

/* We inject minimal shimmer keyframes into <head> if on client. 
   (In a real app, put these in a CSS file.) */
const shimmerKeyframes = `
@keyframes placeholderShimmer {
  0% { background-position: -800px 0; }
  100% { background-position: 800px 0; }
}
`;
if (typeof document !== 'undefined') {
  const styleTag = document.createElement('style');
  styleTag.innerHTML = shimmerKeyframes;
  document.head.appendChild(styleTag);
}

/** A large shimmer that fills the entire row/container.
 *  You can adjust the size or make it responsive.
 */
function FullRowShimmer() {
  return (
    <div style={styles.fullRowShimmer}>
      <div style={styles.shimmerBar} />
    </div>
  );
}

/** The updated “parent” component that maps over your `menuCollections`. */
export default function CollectionRows({menuCollections}) {
  const [isMobile, setIsMobile] = useState(false);

  // Check screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Possibly limit total groups for mobile
  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  return (
    <>
      {displayedCollections.map((menuCollection) => (
        <React.Fragment key={menuCollection.id}>
          {/* Each menuCollection is one “row” or “group” */}
          <MenuCollectionRow menuCollection={menuCollection} />

          {/* In your original code, you show “first 2” items again with ProductRow. 
             We can keep that logic inside the same row container or below as you prefer. */}
          {/* For clarity, I'm moving that logic into the row container as well, 
              or you can keep it here. */}
        </React.Fragment>
      ))}
    </>
  );
}

/**
 * This component renders one row (i.e. one “menuCollection”).
 * It shows a full shimmer until every item’s image is fully loaded.
 */
function MenuCollectionRow({menuCollection}) {
  const [rowLoaded, setRowLoaded] = useState(false);
  const [imagesLoadedCount, setImagesLoadedCount] = useState(0);

  // Intersection observer (optional), if you only want to render
  // once inView.
  const [containerRef, inView] = useInView({
    triggerOnce: true,
    rootMargin: '200px',
  });

  // The total images in this row = the number of items with an image.
  const totalImagesInRow = menuCollection.filter((c) => c.image).length;

  // Each time a child's image loads, increment imagesLoadedCount
  const handleItemImageLoad = () => {
    setImagesLoadedCount((prev) => prev + 1);
  };

  // Once all images in this row are loaded, set rowLoaded = true
  useEffect(() => {
    if (imagesLoadedCount >= totalImagesInRow && totalImagesInRow > 0) {
      setRowLoaded(true);
    }
  }, [imagesLoadedCount, totalImagesInRow]);

  /**
   * If we are using intersection observer,
   * we don't render anything until inView = true
   */
  if (!inView) {
    return <div ref={containerRef} style={{minHeight: '300px'}} />;
  }

  /**
   * If row not fully loaded, show a big shimmer
   * that fills the container’s approximate height
   */
  if (!rowLoaded) {
    return (
      <div
        ref={containerRef}
        style={{position: 'relative', minHeight: '300px'}}
      >
        <FullRowShimmer />
        {/* We still *render* the items behind the shimmer so images can load */}
        <div style={{opacity: 0, pointerEvents: 'none'}}>
          <MenuCollectionRowContent
            menuCollection={menuCollection}
            onItemImageLoad={handleItemImageLoad}
          />
        </div>
      </div>
    );
  }

  // Otherwise, row is loaded => show real content
  return (
    <div ref={containerRef} style={{position: 'relative'}}>
      <MenuCollectionRowContent
        menuCollection={menuCollection}
        onItemImageLoad={handleItemImageLoad}
      />
    </div>
  );
}

/**
 * The actual row content: a slider of items, plus your “first 2” ProductRow logic.
 * We'll pass onItemImageLoad into each item, so we know when each image finishes.
 */
function MenuCollectionRowContent({menuCollection, onItemImageLoad}) {
  return (
    <>
      {/* The row of collections/items */}
      <div className="menu-slider-container">
        {menuCollection.map((collection, index) => (
          <CollectionItem
            key={collection.id}
            collection={collection}
            index={index}
            onImageLoad={onItemImageLoad}
          />
        ))}
      </div>

      {/* The first 2 => ProductRow logic from your code */}
      {menuCollection.slice(0, 2).map((collection) => (
        <div key={collection.id} className="collection-section">
          <div className="collection-header">
            <h3>{collection.title}</h3>
            <Link
              to={`/collections/${collection.handle}`}
              className="view-all-link"
            >
              View All
            </Link>
          </div>
          {/* 
            We do not fade in or out each item individually here, 
            because we are controlling everything at the row level.
            But if you want to do a partial fade, you can. 
          */}
          <ProductRow products={collection.products.nodes} />
        </div>
      ))}
    </>
  );
}

/**
 * A single collection item.
 * We call onImageLoad() once the image is fully loaded
 * so the row knows how many images are done.
 */
function CollectionItem({collection, onImageLoad}) {
  // If there's no image, we consider it “loaded” by default
  // so it won't block the entire row.
  const handleLoad = () => {
    onImageLoad?.();
  };

  return (
    <Link
      to={`/collections/${collection.handle}`}
      className="menu-item-container"
      style={{width: '150px'}}
    >
      {collection.image ? (
        <Image
          srcSet={`${collection.image.url}?width=300&quality=15 300w,
                   ${collection.image.url}?width=600&quality=15 600w,
                   ${collection.image.url}?width=1200&quality=15 1200w`}
          alt={collection.image.altText || collection.title}
          width={150}
          height={150}
          loading="lazy"
          onLoad={handleLoad}
          onError={handleLoad}
        />
      ) : null}
      <div className="category-title">{collection.title}</div>
    </Link>
  );
}

const styles = {
  fullRowShimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: '#f6f7f8',
    overflow: 'hidden',
  },
  shimmerBar: {
    width: '100%',
    height: '100%',
    backgroundImage:
      'linear-gradient(to right, #f6f7f8 0%, #eaeaea 20%, #f6f7f8 40%, #f6f7f8 100%)',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '800px 104px',
    animation: 'placeholderShimmer 1s linear infinite forwards',
  },
};
