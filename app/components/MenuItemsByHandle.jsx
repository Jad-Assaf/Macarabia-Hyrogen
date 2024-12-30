export default function MenuItemsByHandle({menu, handle}) {
  console.log('Menu Data:', menu); // Debugging
  console.log('Handle:', handle); // Debugging

  const menuItem = menu.items.find(
    (item) => item.title.toLowerCase() === handle.toLowerCase(),
  );

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
