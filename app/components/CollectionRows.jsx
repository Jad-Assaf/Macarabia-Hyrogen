import React, {useRef, useEffect, useState} from 'react';
import {Link} from '@remix-run/react';
import {ProductRow} from './CollectionDisplay';
import {Image} from '@shopify/hydrogen-react';
import {useInView} from 'react-intersection-observer';

const CollectionRows = ({menuCollections}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if the screen width is less than 768px
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const displayedCollections = isMobile
    ? menuCollections.slice(0, 14)
    : menuCollections;

  return (
    <>
      {displayedCollections.map((menuCollection, index) => {
        const [containerRef, containerInView] = useInView({
          triggerOnce: true,
          rootMargin: '100px', // Trigger slightly earlier for smoother transitions
        });

        return (
          <React.Fragment key={menuCollection.id}>
            <div
              ref={containerRef}
              className={`menu-slider-container fade-in ${
                containerInView ? 'visible' : ''
              }`}
              style={{
                opacity: containerInView ? 1 : 0,
                transform: containerInView
                  ? 'translateY(0)'
                  : 'translateY(50px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}
            >
              {menuCollection.map((collection, collectionIndex) => (
                <CollectionItem
                  key={collection.id}
                  collection={collection}
                  delay={collectionIndex * 0.1} // Add delay for staggered effect
                />
              ))}
            </div>

            {menuCollection.slice(0, 2).map((collection) => {
              const [productRowRef, productRowInView] = useInView({
                triggerOnce: true,
                rootMargin: '100px',
              });

              return (
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
                  <div
                    ref={productRowRef}
                    className={`product-row fade-in ${
                      productRowInView ? 'visible' : ''
                    }`}
                    style={{
                      opacity: productRowInView ? 1 : 0,
                      transform: productRowInView
                        ? 'translateY(0)'
                        : 'translateY(50px)',
                      transition: 'opacity 0.6s ease, transform 0.6s ease',
                    }}
                  >
                    {productRowInView && (
                      <ProductRow products={collection.products.nodes} />
                    )}
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </>
  );
};

const CollectionItem = ({collection, delay}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      {rootMargin: '100px'},
    );

    if (ref.current) observer.observe(ref.current);
    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="animated-menu-item"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0.95)',
        transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
      }}
    >
      <Link
        to={`/collections/${collection.handle}`}
        className="menu-item-container"
      >
        {collection.image && (
          <Image
            srcSet={`${collection.image.url}?width=300&quality=15 300w,
                                 ${collection.image.url}?width=600&quality=15 600w,
                                 ${collection.image.url}?width=1200&quality=15 1200w`}
            alt={collection.image.altText || collection.title}
            className="menu-item-image"
            width={150}
            height={150}
            loading="lazy"
          />
        )}
        <div className="category-title">{collection.title}</div>
      </Link>
    </div>
  );
};

export default CollectionRows;
