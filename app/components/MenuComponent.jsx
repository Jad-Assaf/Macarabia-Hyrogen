import React from 'react';

const MenuComponent = ({ menu }) => {
  if (!menu || !menu.items || menu.items.length === 0) {
    return <p>No menu items available.</p>;
  }

  return (
    <div className="menu-container">
      <h2>Menu</h2>
      <ul className="menu-list">
        {menu.items.map((item) => (
          <li key={item.id}>
            <a href={item.url}>{item.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenuComponent;
