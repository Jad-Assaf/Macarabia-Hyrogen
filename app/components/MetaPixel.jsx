// src/utils/FacebookPixel.jsx
import {useEffect} from 'react';
import ReactPixel from 'react-facebook-pixel';

const MetaPixel = ({pixelId}) => {
  useEffect(() => {
    if (!pixelId) return;

    ReactPixel.init(pixelId);
    ReactPixel.pageView(); // Track initial page view

    // Optionally, track page views on route changes
    // You can integrate with your routing library to detect route changes
  }, [pixelId]);

  return null;
};

export default MetaPixel;
