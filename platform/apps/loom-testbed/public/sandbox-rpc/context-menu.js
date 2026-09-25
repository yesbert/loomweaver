(function () {
  let openMenu = null;

  function closeMenu() {
    if (openMenu) {
      document.removeEventListener('pointerdown', closeOnOutsidePointer, true);
      openMenu.remove();
      openMenu = null;
    }
  }

  function closeOnOutsidePointer(event) {
    if (openMenu && !openMenu.contains(event.target)) {
      closeMenu();
    }
  }

  globalThis.openContextMenu = function (x, y, items, onSelect) {
    closeMenu();
    const menu = document.createElement('lw-menu');
    for (const item of items) {
      const entry = document.createElement('lw-menu-item');
      entry.setAttribute('command', item.command);
      entry.setAttribute('label', item.label);
      menu.append(entry);
    }
    document.body.append(menu);
    menu.openAt(x, y);
    openMenu = menu;
    menu.addEventListener('lw-menu-select', function (event) {
      closeMenu();
      onSelect(event.detail.command);
    });
    menu.addEventListener('lw-menu-dismiss', closeMenu);
    setTimeout(function () {
      document.addEventListener('pointerdown', closeOnOutsidePointer, true);
    });
  };
})();
