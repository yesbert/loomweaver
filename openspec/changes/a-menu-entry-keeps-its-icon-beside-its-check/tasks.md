## 1. The entry draws its check and its icon

- [x] 1.1 Give the menu entry element a leading place for the check before the one for the icon,
      each drawn from its own attribute, so an entry with a state keeps its command's icon.
- [x] 1.2 Let the host reserve the two places independently: one class when any entry in the menu
      carries a check, one when any carries an icon, with the stylesheet showing each place under
      its class at the same fixed width.
- [x] 1.3 Unit tests on the element: a checked entry with an icon shows check then icon; an
      unchecked one shows the icon with an empty check place; a plain entry with an icon is
      unchanged; the roles and `aria-checked` are unchanged. Unit tests on the host: a menu of
      checks reserves no icon place, a menu of icons reserves no check place, a menu with both
      reserves both.

## 2. Saying it exists

- [x] 2.1 The menus guide says an entry with `checkedWhen` keeps its command's icon, beside the
      checkbox paragraph.
- [x] 2.2 `openspec validate --all --strict`, lint and the shell unit suite green.
