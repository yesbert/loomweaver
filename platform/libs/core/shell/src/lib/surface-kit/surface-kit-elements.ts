/** `<lw-button>`: a button drawn as the workbench draws its own. Every property is an attribute too. */
export interface LwButtonElement extends HTMLElement {
  get variant():
    | 'primary'
    | 'default'
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'ghost';
  set variant(
    value:
      | 'primary'
      | 'default'
      | 'success'
      | 'danger'
      | 'warning'
      | 'info'
      | 'ghost'
      | null,
  );
  get size(): 'sm' | 'md';
  set size(value: 'sm' | 'md' | null);
  /** The attribute is `icon-only`. */
  iconOnly: boolean;
  disabled: boolean;
}

/** `<lw-icon>`: a glyph of the workbench's set, or one registered with `LwFrame.setIcon`, by name. */
export interface LwIconElement extends HTMLElement {
  get name(): string;
  set name(value: string | null);
  /** A CSS length, width and height alike. */
  get size(): string;
  set size(value: string | null);
}

/** `<lw-markdown>`: rich text, parsed and sanitised from `source`. */
export interface LwMarkdownElement extends HTMLElement {
  get source(): string;
  set source(value: string | null);
}

/** The edges of what a menu opens beside, as `getBoundingClientRect()` answers them. */
export interface LwMenuAnchorRect {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** `<lw-menu>`: a menu of `<lw-menu-item>` children. Append it to the document, then open it. */
export interface LwMenuElement extends HTMLElement {
  openAt(x: number, y: number): void;
  openBeside(
    rect: LwMenuAnchorRect,
    side: 'top' | 'right' | 'bottom' | 'left',
  ): void;
}

/** `<lw-menu-item>`: one entry of a `<lw-menu>`; `command` is what choosing it reports. */
export interface LwMenuItemElement extends HTMLElement {
  label: string | null;
  command: string | null;
}

/** `<lw-nav-group>`: a named, foldable group of `<lw-nav-item>` children in a `<lw-nav-tree>`. */
export interface LwNavGroupElement extends HTMLElement {
  get label(): string;
  set label(value: string | null);
  /** What the fold is remembered under for the session; the label where none is given. */
  get key(): string;
  set key(value: string | null);
  /** Whether the group starts folded. */
  collapsed: boolean;
  readonly open: boolean;
  toggle(): void;
}

/** `<lw-nav-item>`: one destination in a `<lw-nav-tree>`; `path` is the address it stands for. */
export interface LwNavItemElement extends HTMLElement {
  get path(): string;
  set path(value: string | null);
  get label(): string;
  set label(value: string | null);
  icon: string | null;
}

/** `<lw-nav-tree>`: sidebar navigation; `current` is the address shown, and the item it lies at or under is marked. */
export interface LwNavTreeElement extends HTMLElement {
  current: string | null;
}

/** `<lw-option>`: one choice of a `<lw-select>`. */
export interface LwOptionElement extends HTMLElement {
  value: string | null;
  icon: string | null;
}

/** `<lw-select>`: a choice among `<lw-option>` children; `value` is the chosen option's. */
export interface LwSelectElement extends HTMLElement {
  value: string | null;
  compact: boolean;
  required: boolean;
}

/** `<lw-spinner>`: the busy indicator. */
export interface LwSpinnerElement extends HTMLElement {
  /** A CSS length, width and height alike. */
  get size(): string;
  set size(value: string | null);
  /** The name announced for it; leave it out where the text around it already says what is running. */
  get label(): string;
  set label(value: string | null);
}

/**
 * `<lw-toolbar>`: a toolbar the workbench fills from the slot `menu` names, once the surface has
 * called `LwFrame.connectToolbars`.
 */
export interface LwToolbarElement extends HTMLElement {
  /** The slot whose entries the toolbar shows. */
  menu: string | null;
  /** The name it is announced by, taken as written; the slot's registered title where none is given. */
  label: string | null;
  get size(): 'sm' | 'md';
  set size(value: 'sm' | 'md' | null);
  /**
   * The description the slot's entries are matched against and run with: named strings, numbers
   * and booleans only, anything else is refused by the workbench. Setting it asks the workbench
   * again. As an attribute it is the same object written as JSON.
   */
  get context(): Readonly<Record<string, string | number | boolean>>;
  set context(
    value: Readonly<Record<string, string | number | boolean>> | undefined,
  );
}

/** `<lw-tooltip>`: the last child of a positioned trigger; shown on hover and focus. */
export interface LwTooltipElement extends HTMLElement {
  text: string | null;
  get position(): 'top' | 'bottom' | 'left' | 'right';
  set position(value: 'top' | 'bottom' | 'left' | 'right' | null);
}

/**
 * The elements the kit defines, by tag, so that `document.createElement('lw-toolbar')` and
 * `querySelector('lw-toolbar')` answer with the element's own shape. `<lw-progress-ring>` takes
 * attributes alone (`value`, `max`, `size`).
 */
export interface LwElementTagNameMap {
  'lw-button': LwButtonElement;
  'lw-icon': LwIconElement;
  'lw-markdown': LwMarkdownElement;
  'lw-menu': LwMenuElement;
  'lw-menu-item': LwMenuItemElement;
  'lw-nav-group': LwNavGroupElement;
  'lw-nav-item': LwNavItemElement;
  'lw-nav-tree': LwNavTreeElement;
  'lw-option': LwOptionElement;
  'lw-progress-ring': HTMLElement;
  'lw-select': LwSelectElement;
  'lw-spinner': LwSpinnerElement;
  'lw-toolbar': LwToolbarElement;
  'lw-tooltip': LwTooltipElement;
}
