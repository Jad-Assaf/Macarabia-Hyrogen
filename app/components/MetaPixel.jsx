// src/components/MetaPixel.jsx
import {useEffect} from 'react';

const MetaPixel = ({pixelId}) => {
  useEffect(() => {
    const loadReactPixel = async () => {
      if (!pixelId) return;

      try {
        // Dynamically import react-facebook-pixel
        const ReactPixel = (await import('react-facebook-pixel')).default;

        ReactPixel.init(pixelId);
        ReactPixel.pageView(); // Track initial page view

        // Example: Track additional events here or integrate with routing
      } catch (error) {
        console.error('MetaPixel Error:', error);
      }
    };

    loadReactPixel();
  }, [pixelId]);

  return null;
};

export default MetaPixel;
