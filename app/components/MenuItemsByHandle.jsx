export default function MenuItemsByHandle({menu, handle}) {
  console.log('Menu Data:', menu.items); // Debugging
  console.log('Handle:', handle); // Debugging

  const menuItem = menu.items.find(
    (item) => item.title.toLowerCase() === handle.toLowerCase(),
  );

  if (!menuItem) {
    console.warn(`No menu item found for handle: ${handle}`);
    // Display all items for debugging
    return (
      <div>
        <p>No menu items found for "{handle}". Showing all items:</p>
        <ul>
          {menu.items.map((item) => (
            <li key={item.id}>
              <a href={item.url}>{item.title}</a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="menu-items">
      <h2>{menuItem.title}</h2>
      <ul>
        <li key={menuItem.id}>
          <a href={menuItem.url}>{menuItem.title}</a>
        </li>
      </ul>
    </div>
  );
}
