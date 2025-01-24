// src/utils/FacebookPixel.js
import React, {useEffect} from 'react';
import ReactPixel from 'react-facebook-pixel';

const FacebookPixel = ({pixelId}) => {
  useEffect(() => {
    if (!pixelId) return;

    ReactPixel.init(pixelId);
    ReactPixel.pageView(); // Track page view on initial load
  }, [pixelId]);

  return null;
};

export default FacebookPixel;
