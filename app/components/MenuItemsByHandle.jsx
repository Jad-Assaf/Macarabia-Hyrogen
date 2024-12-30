import React from 'react';

export default function MenuItemsByHandle({menu, handle}) {
  // Find the menu item by handle
  const menuItem = menu.items.find((item) => item.url.includes(handle));

  if (!menuItem) {
    return null; // No matching menu item found
  }

  return (
    <div className="menu-items">
      <h2>{menuItem.title}</h2>
      <ul>
        {menuItem.items?.map((subItem) => (
          <li key={subItem.id}>
            <a href={subItem.url}>{subItem.title}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
