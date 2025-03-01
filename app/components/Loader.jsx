import React, {useState, useEffect} from 'react';
import './Loader.css';

const Loader = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => {
      setIsLoaded(true);
    };

    // Listen for the window load event
    window.addEventListener('load', handleLoad);
    return () => window.removeEventListener('load', handleLoad);
  }, []);

  // When the page is loaded, remove the loader
  if (isLoaded) return null;

  return (
    <div className="loader-overlay">
      <div className="loading-bar"></div>
    </div>
  );
};

export default Loader;
