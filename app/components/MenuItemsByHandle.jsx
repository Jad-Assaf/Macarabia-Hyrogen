export default function MenuItemsByHandle({menu, handle}) {

  const menuItem = menu.items.find(
    (item) => item.title.toLowerCase() === handle.toLowerCase(),
  );

  if (!menuItem) {
    return (
      <div>
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
