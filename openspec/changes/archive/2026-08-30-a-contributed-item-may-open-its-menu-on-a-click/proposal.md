> **Status:** approved.

## Why

An item a plugin contributes to the chrome may name a menu slot, but the workbench opens that slot
only on a right-click. Every workbench with an account entry or an overflow button needs the other
gesture: a control whose *primary* click opens a menu anchored to it. Today a distribution cannot
have one.

Working around it inside a weaver fails at the seam. An item's own trigger receives no coordinates,
so it cannot say where the host drew it; the menu it opens by hand takes literal labels instead of
the command titles the declared path translates for it; and the control that would have to announce
the menu belongs to the host, not to the plugin. The gesture is the only thing missing, and only the
host can supply it.

## What Changes

- A contributed launcher entry or bar button may declare which gesture opens its menu: the context
  gesture (the default, unchanged), the primary click, or both.
- The primary click opens the item's **declared slot**, resolved the same way the context gesture
  resolves it, so entries keep their command titles, icons, shortcuts and grouping. The workbench's
  own entries for that item, such as its curation entries, stay on the context gesture, where they
  belong.
- An item whose purpose is to open a menu is drawn. Today an item that names neither a command, an
  inline behaviour nor a workspace is dropped before it reaches the chrome, which would make the new
  gesture unreachable.
- A menu opened from a control is placed **beside that control**: on the declared side where there is
  room, on the opposite side where there is not, and never covering the control it belongs to. A menu
  opened at a pointer keeps the placement it has today.
- A control that opens a menu says so, and says whether the menu is open. This is stated once and
  holds for every menu the workbench opens from a control, including the four it already opens from
  its own controls, none of which announces it today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `menus`: the gesture that opens a contributed item's menu becomes the item's own declaration
  rather than always the context gesture; a menu opened from a control is placed beside it rather
  than at a point; a control that opens a menu announces that it does and whether it is open.

## Impact

- **Published contract:** `RailItem` and `BarButtonItem` gain an optional gesture declaration.
  Additive; every existing composition keeps the context gesture it has today.
- **Shell:** the menu service gains an anchored form of opening a declared slot, the menu element
  gains side placement with a flip, the directive that wires the context gesture also wires the
  primary one, and the rail and bar stop dropping an item whose purpose is its menu.
- **Documentation:** `llms-full.txt` and the JSDoc on both item types.
- **Legacy sources dissolved:** none.
