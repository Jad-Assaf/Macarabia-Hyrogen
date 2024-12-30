// MenuSlider.jsx
import React from 'react';
import {useInView} from 'react-intersection-observer';
import { CollectionItem } from './CollectionRows';

const MenuSlider = ({menuCollection}) => {
  return (
    <div className="menu-slider-container">
      {menuCollection.map((collection, collectionIndex) => {
        const {ref, inView} = useInView({
          triggerOnce: true,
          threshold: 0.1, // Trigger when 10% of the component is visible
        });

        return (
          <div className="animated-menu-item" ref={ref} key={collection.id}>
            {inView && (
              <CollectionItem collection={collection} index={collectionIndex} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MenuSlider;
