import React from 'react';

export default function MenuItemsByHandle({menu, handle}) {
  const menuItem = menu.items.find(
    (item) => item.title.toLowerCase() === handle,
  );

  if (!menuItem) {
    console.warn(`No menu item found for handle: ${handle}`);
    return null; // No matching menu item
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
