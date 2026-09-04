# Sidebars

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `shell-layout` · `host-services`. Where this page and a specification disagree, the
> specification is right, and that is a defect in this page: change the behaviour there, then
> explain it here.

Collapse, resize, hide and show, by the region ids you declared and the view ids you registered.

## Do it

```ts
const sidebars = inject(SidebarService);

sidebars.collapse('left-panel'); sidebars.expand('left-panel'); sidebars.toggle('left-panel');
sidebars.setWidth('left-panel', 320);   // clamped to the usable range, remembered like a released drag
sidebars.hideView('acme.outline');      // asks about unsaved work exactly as the view menu does
sidebars.showView('acme.outline');      // back where it was declared, or in the region you name
```

## Read it

```ts
sidebars.regions();               // SidebarFacts[]: regionId, collapsed, width, per declared panel
sidebars.isCollapsed('left-panel');  // reactive where it is read
sidebars.width('left-panel');
sidebars.hiddenViews();           // readonly string[]: the ids of the hidden views
```

`regions()` lists every declared panel as `SidebarFacts`: `regionId`, `collapsed`, `width`. `hiddenViews()` lists the ids of hidden views. `isCollapsed(regionId)` and `width(regionId)` read the same signals and are reactive where they are called.

## What asks about unsaved work

`hideView` asks exactly as the view menu does, for the surfaces the view holds. Collapsing, resizing and showing ask nothing.

## Switched off

`sidebar.collapse`, `sidebar.resize` and `sidebar.hideViews` take the header control, the splitter and the menu entry away from the user; every action here keeps working for you.

## In depth

**Unknown ids.** A region id that no declared panel carries does nothing.

**Same code as the controls.** Every action is the one the sidebar header, the splitter and the
view menu run, with the guard named above. The switches do not reach the service, as _Switched off_
says.

## Where the story is told

- [Layout: regions and docks](../distribution/layout.md): declaring the panels.
- [Shell anatomy](../reference/shell-anatomy.md): the region vocabulary.
