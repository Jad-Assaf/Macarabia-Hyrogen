// app/components/MenuSlider.jsx

import React from 'react';
import {useInView} from 'react-intersection-observer';
import { CollectionItem } from './CollectionRows';

export function MenuSlider({menuCollection = []}) {
  return (
    <div className="menu-slider-container">
      {menuCollection.map((collection, collectionIndex) => {
        const [collectionRef, collectionInView] = useInView({
          triggerOnce: true,
        });

        return (
          <div
            className="animated-menu-item"
            ref={collectionRef}
            key={collection.id}
          >
            {collectionInView && (
              <CollectionItem collection={collection} index={collectionIndex} />
            )}
          </div>
        );
      })}
    </div>
  );
}
