import React from 'react';

const MenuComponent = ({ menu }) => {
  if (!menu || !menu.items || menu.items.length === 0) {
    return <p>No menu items available.</p>;
  }

  return (
    <div className="menu-component">
      <h2>Menu</h2>
      <ul className="menu-list">
        {menu.items.map((item) => (
          <li key={item.id} className="menu-item">
            <a href={item.url} className="menu-link">
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenuComponent;
