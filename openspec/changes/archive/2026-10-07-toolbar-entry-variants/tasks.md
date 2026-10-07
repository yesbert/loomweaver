## 0. Inventory

- [x] 0.1 List every place a toolbar entry's look is decided or copied today: the entry model, its resolution, the drawn list, the isolated surface's answer and its mapping, the channel sanitiser, the element's drawing and the frame stylesheet; reuse what is there and add no parallel path

## 1. Contract

- [x] 1.1 The menu entry gains an optional variant typed with the existing button vocabulary, with JSDoc saying it is honoured only in a toolbar, that no variant is today's look and not `default`, and that primary is kept to the slot's owner
- [x] 1.2 The surface kit's slot entry gains the same optional variant, so the frame declaration carries it

## 2. Resolution and the owner rule

- [x] 2.1 The resolved toolbar entry carries the plugin that contributed it, from the registry's record of the menu entry
- [x] 2.2 The toolbar service decides the drawn variant once: the named variant, or none where primary was asked by anyone but the slot's owner (the toolbar's registrant, or the surface's owner for an actions slot), or where the name is outside the vocabulary
- [x] 2.3 A refused primary and an unknown name are reported once per entry and slot, naming the asking plugin and the slot's owner
- [x] 2.4 Unit tests: owner's primary kept; contributor's primary dropped and reported once across redraws; contributed danger kept; an entry no plugin contributed gets no primary; unknown name dropped and reported; an actions slot honours the surface owner's primary

## 3. Drawing

- [x] 3.1 The toolbar element draws an entry with a variant with the button's variant classes at the toolbar's height, square where it shows only an icon
- [x] 3.2 A primary entry shows its icon, title and shortcut where it has them
- [x] 3.3 An entry that shows its title and opens a slot ends with a chevron hidden from assistive technology
- [x] 3.4 An entry without a variant renders unchanged; pinned by a test against today's markup
- [x] 3.5 Element tests for 3.1 to 3.3, including an entry folded into the tray keeping its look
- [x] 3.6 The menu renderer does not read the variant; a test pins that a danger entry in a menu is drawn as any other

## 4. Isolated surfaces

- [x] 4.1 The channel sanitiser carries a variant from the vocabulary and drops any other value with a report, keeping the entry
- [x] 4.2 The isolated surface's answer carries the variant already narrowed by the owner rule
- [x] 4.3 Tests: a sandboxed plugin's danger entry is drawn in the page; the answer told to an isolated owner holds its own primary, a contributor's danger and no look for a contributor's primary
- [x] 4.4 The frame bundle draws the variants with the same look; check the built frame stylesheet holds every variant class the element uses

## 5. Documentation and verification

- [x] 5.1 The menus guide documents the variant with an example of a primary entry that opens a slot others fill, the owner rule, and the one-sentence note that no variant is not `default`
- [x] 5.2 The sandboxed surfaces guide names the variant among what the answer carries
- [x] 5.3 The packed-declaration documentation guard passes with the new field documented
- [x] 5.4 The accessibility scan over a toolbar with every variant in light and dark passes
- [x] 5.5 `openspec validate --all --strict`, lint by exit code, the shell and frame-kit tests and builds pass
