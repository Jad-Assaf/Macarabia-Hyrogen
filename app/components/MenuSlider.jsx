// ~/components/MenuSlider.jsx
import React from 'react';
import { useInView } from 'react-intersection-observer';
import { CollectionItem } from './CollectionItem';

export function MenuSlider({ menusByHandle = [] }) {
  return (
    <div className="menu-slider-container">
      {menusByHandle.map(({ handle, menu }) => {
        const [ref, inView] = useInView({ triggerOnce: true });

        return (
          <div className="animated-menu-item" ref={ref} key={handle}>
            {inView && (
              <CollectionItem 
                handle={handle} 
                menuItems={menu.items}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
