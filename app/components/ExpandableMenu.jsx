import React, {useState, useRef, useEffect} from 'react';
import {Link} from '@remix-run/react';
import {Image} from '@shopify/hydrogen-react';
import '../styles/CollectionSlider.css';

export const ExpandableMenu = ({menuItems}) => {
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [collapsingCategory, setCollapsingCategory] = useState(null);

  const handleCategoryClick = (id) => {
    if (expandedCategory === id) {
      // Collapse currently expanded category
      setCollapsingCategory(id);
      setTimeout(() => {
        setCollapsingCategory(null);
        setExpandedCategory(null);
      }, 500); // Match the collapse animation duration
    } else {
      // Expand new category
      setCollapsingCategory(null);
      setExpandedCategory(id);
    }
  };

  return (
    <div className="slide-con">
      <h3 className="cat-h3">Shop By Categories</h3>
      <div className="category-slider">
        {menuItems.map((item, index) => (
          <ExpandableMenuItem
            key={item.id}
            item={item}
            index={index}
            isExpanded={expandedCategory === item.id}
            isCollapsing={collapsingCategory === item.id}
            onCategoryClick={handleCategoryClick}
          />
        ))}
      </div>
    </div>
  );
};

const ExpandableMenuItem = ({
  item,
  index,
  isExpanded,
  isCollapsing,
  onCategoryClick,
}) => {
  const containerRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isInView, setIsInView] = useState(false);
  const hasSubItems = item.items && item.items.length > 0;

  const handleMobileDropdownPosition = () => {
    if (!dropdownRef.current || window.innerWidth > 768) return; // Only on mobile

    const dropdown = dropdownRef.current;

    // Reset styles
    dropdown.style.left = 'auto';
    dropdown.style.transform = 'none';

    // Adjust based on index
    if ([0, 3, 6, 9].includes(index)) {
      dropdown.style.left = '100%';
    } else if ([2, 5, 8, 11].includes(index)) {
      dropdown.style.left = '-100%';
    } else if ([12].includes(index)) {
      dropdown.style.left = '50%';
    } else if ([13].includes(index)) {
      dropdown.style.left = '-50%';
    } else {
      dropdown.style.left = '0';
    }
  };

  useEffect(() => {
    if (isExpanded) {
      handleMobileDropdownPosition();
    }
  }, [isExpanded]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      {threshold: 0.1},
    );
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, []);

  const handleClick = (e) => {
    if (hasSubItems) {
      e.preventDefault();
      onCategoryClick(item.id);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`category-item 
                ${isExpanded ? 'expanded' : ''} 
                ${isCollapsing ? 'collapsing' : ''}`}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateX(0)' : 'translateX(-30px)',
        transition: `opacity 0.2s ease ${index * 0.01}s, transform 0.2s ease ${
          index * 0.01
        }s`,
      }}
    >
      <div className="category-container">
        {hasSubItems ? (
          <div onClick={handleClick} className="category-link">
            <ExpandableMenuContent item={item} isInView={isInView} />
          </div>
        ) : (
          <Link to={item.url} className="category-link">
            <ExpandableMenuContent item={item} isInView={isInView} />
          </Link>
        )}
      </div>
      {hasSubItems && (
        <div
          ref={dropdownRef}
          className={`subcategory-list 
                        ${isExpanded ? 'expanded' : ''} 
                        ${isCollapsing ? 'collapsing' : ''}`}
        >
          {item.items.map((subItem, subIndex) => (
            <ExpandableMenuItem
              key={subItem.id}
              item={subItem}
              index={subIndex}
              isExpanded={false}
              isCollapsing={false}
              onCategoryClick={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ExpandableMenuContent = ({item, isInView}) => {
  const title = item.title;

  return (
    <>
      <div
        className="category-image-container"
        style={{
          filter: isInView ? 'blur(0px)' : 'blur(10px)',
          opacity: isInView ? 1 : 0,
          transition: 'filter 0.3s ease, opacity 0.3s ease',
        }}
      >
        {item.image ? (
          <Image
            data={item.image}
            aspectRatio="1/1"
            sizes="(min-width: 45em) 20vw, 40vw"
            alt={item.image?.altText || title}
            className="category-image"
            width="150px"
            height="150px"
          />
        ) : (
          <div className="category-placeholder-image"></div>
        )}
      </div>
      <div className="category-title">{title}</div>
    </>
  );
};
