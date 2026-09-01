# Design tokens & the `<lw-*>` vocabulary

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `theming` · `ui-primitives`. Where this page and a
> specification disagree, the specification is right, and that is a defect in this page: change
> the behaviour there, then explain it here.

**Who this page is for:** anyone writing templates or styles in a weaver or a distribution — with
Tailwind, with Bootstrap or another CSS framework, or with no framework at all.

Every colour and font in a LoomWeaver UI comes from a small set of plain **CSS custom properties**
(the `--lw-*` tokens), plus CSS class contracts (`.lw-*`) and host elements (`<lw-*>`). Because the
tokens are ordinary CSS variables, **they work with any CSS framework**. Tailwind is one way to
consume them — not a requirement.

## Which path am I on?

| You are…                                           | You consume the tokens through…                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Using Bootstrap, another framework, or no framework** | the pre-compiled `@loomweaver/shell/styles/shell.css` — no Tailwind install needed. Setup: [bringing your own CSS framework](../manual-setup.md#bringing-your-own-css-framework). `loom theme --preset bootstrap` maps the tokens onto Bootstrap's own variables so both worlds share one palette. In your own CSS, read a token directly: `color: var(--lw-content)`. |
| **Using Tailwind**                                 | the [setup below](#setup-with-tailwind) — every token doubles as a semantic utility (`bg-surface`, `text-brand`, …).                                                                                                                                                                                                          |
| **Writing a frame plugin**            | the frame UI kit: `<link rel="stylesheet" href="/frame-kit/lw-frame.css">` — the same tokens and `.lw-*` contracts; the host pushes its resolved token values into your iframe over RPC.                                                                                                                               |

Everything below applies on **all three paths**, because the token names and class contracts are
identical either way. The one rule everywhere: **use only the semantic tokens, never raw palette
colours** (no `bg-slate-800`, no hard-coded hex for UI chrome). All colour tokens are
WCAG-AA-verified; which tone is for what (text vs. fill vs. icon) →
[`accessibility.md`](accessibility.md).

## Setup with Tailwind

Only needed if you write Tailwind utilities of your own — the other two paths need no setup.

- Entry point: your app's `src/styles.css`, building against the published `@loomweaver/shell` package:
  ```css
  @import 'tailwindcss';
  @source '../node_modules/@loomweaver/shell';    /* also scan the shell library's classes */
  @source './app';
  @import '@loomweaver/shell/styles/theme.css';
  ```
  (Inside the LoomWeaver monorepo the same file uses source paths instead:
  `@source '../../../libs/core/shell/src'` + `@import '../../../libs/core/shell/src/lib/styles/theme.css'`.)
- Tailwind reports **no error** for a mistyped/non-existent class — it is silently ignored. The
  ESLint guardrail (`no-unregistered-classes`, [see below](#guardrail)) catches that.
- **No** `tailwind.config.js` — everything is CSS-first. Built via `@tailwindcss/postcss` (`.postcssrc.json`).
- Tokens + theme: **one source** = `libs/core/shell/src/lib/styles/theme.css`.
- Dark mode: `ThemeService` toggles the `dark` class on `<html>`. The `--lw-*` ladder flips in
  `:root.dark`; the semantic utilities stay identical (no `dark:` prefix needed).

## Token precedence & cascade layers

The `--lw-*` tokens live in **CSS cascade layers**, declared at the top of `theme.css`:

```css
@layer lw-base, lw-plugin-theme, lw-tenant-theme;
```

A later layer wins → **product default (`lw-base`) < plugin (`lw-plugin-theme`) < tenant
(`lw-tenant-theme`)**. A plugin contributes tokens through `ctx.contributeTheme(tokens, dark?)`
(injected into `lw-plugin-theme` as `:root`/`:root.dark`, **never** inline styles — those would beat
every layer); the optional second `dark` argument overrides tokens in dark mode only (worked example
in [authoring a weaver → custom theme](../authoring-a-weaver.md#custom-theme--ctxcontributetheme)). A
distribution/tenant theme CSS uses `lw-tenant-theme` (the devkit `theme` generator emits that) and
thereby overrules every plugin. Layer order beats specificity, so that also holds against a
`:root.dark` token from a lower layer. A minimal tenant override:

```css
@layer lw-tenant-theme {
  :root {
    --lw-brand: #2e96c9;
    --lw-accent: #c59a2f;
  }
  :root.dark {
    --lw-brand: #3aa9dd;
    --lw-accent: #d8b45a;
  }
}
```

## Dimensions: there are no tokens, and how to change them anyway

The token vocabulary is **colour and type only** — 27 colours plus the two font families. Sizes,
radii, spacing and border widths are ordinary utility classes in the shell's own templates, and that
is a decision rather than an omission: tokenising every number would turn every rule of our chrome
into a promise we could never revise without breaking somebody's product. The one measurement that
*is* a contract is the shared bar-control height (see below), and it exists because it drifted twice
without one.

One measurement is not a size question at all and therefore *is* in the contract: whether the host
insets a surface from its pane edges. The host insets nothing of its own, so a surface fills the pane
it is mounted in. A product that wants its surfaces inset asks for it once, with
[`padding: 'inset'`](../authoring-a-weaver.md#reaching-the-pane-edges) on `provideShell`, and a
single surface that differs says so with `padded`. How *wide* the inset is stays a stylesheet
question, below.

## Size against the pane, never against the window

**This is the mistake to know about before you write a template.** A surface is mounted in a pane,
and the user decides how wide that pane is. Splitting the content area halves the pane while the
browser window stays exactly as wide as it was, so a layout built on viewport breakpoints keeps a
shape that no longer fits and its content runs out of the box meant to hold it.

The workbench therefore gives every surface it renders a sizing reference that tracks the pane, named
`surface`. You do not arrange it, and it follows the surface wherever the user puts it — the content
pane, a split, a sidebar, a pop-out window.

With Tailwind, use the container variants rather than `sm:` / `lg:` / `xl:`:

```html
<!-- wrong: fires on the window, which the user did not resize -->
<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

<!-- right: fires on the pane the surface was given -->
<div class="grid gap-4 @sm:grid-cols-2 @2xl:grid-cols-4">
```

The numbers are not the same numbers. A viewport breakpoint counts the launcher rail, any open side
panel and the pane's own padding; the container one counts only the width your content actually has.
Pick each from the width at which that layout stops fitting.

Bare `@sm:` resolves against the nearest reference, which is the workbench's unless your own template
declares one with `@container`. Where you need the pane from inside your own nested container, name
it: `@2xl/surface:grid-cols-3`.

Without Tailwind it is an ordinary container query, and the name is the whole contract:

```css
@container surface (width >= 42rem) {
  .my-cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
```

Two things that bite even with the right variants. A grid or flex child does not shrink below its
content unless you say `min-w-0`, and a chart canvas reports a content width — so a card holding one
will hold its column open no matter what the breakpoints say. And a surface presented as an isolated
document needs none of this: its frame *is* the pane, so ordinary viewport queries inside it are
already pane queries.

If your product must change a size anyway, you can, with plain CSS and no API. Everything the shell
paints lives in a cascade layer, and **unlayered CSS beats layered CSS** regardless of specificity or
load order — so a normal stylesheet in your app wins by construction, without `!important`:

```css
/* src/styles.css — after the shell import, and NOT inside a @layer */
.lw-icon-btn      { border-radius: 0; height: 2.5rem; }  /* squarer, roomier buttons */
.lw-segmented     { height: 3rem; }
lw-shell-rail nav { width: 64px; }                       /* a wider activity bar */
```

Two kinds of target, with different promises:

- **The `.lw-*` class contracts** (`.lw-btn`, `.lw-icon-btn`, `.lw-field`, `.lw-segmented`,
  `.lw-badge`, …) are documented and stable — the same contract a plugin paints against.
- **The element tags** (`lw-shell-rail`, `lw-shell-panel`, `lw-content-area`, `lw-pane-tab-strip`, …)
  reach the structure, but they are **not** a versioned contract. They move when we restructure the
  chrome, and nothing warns you. Targeting them is supported in the sense that it works and we will
  not fight it; it is not supported in the sense that we promise it keeps working.

Two honest limits. The rules do **not** reach a sandboxed plugin's surface — that is a separate
document which receives our compiled stylesheet and the token push, not your stylesheet. And a size
you change is yours to re-check on upgrade; colours you set through tokens are not.

If you find yourself writing more than a handful of these rules, say so — a small, named set of
dimension tokens is the answer at that point, and knowing which sizes real products ask for is
exactly what decides the set.

Our own showcase is the first measurement of that. A look that only recolours needs **two** of these
rules. A look that also changes the geometry needed **nine** (fourteen selectors), and they clustered
tightly: corner radii on the control classes, the control height, the activity-bar width, the top-bar
and tab-strip heights, and the panel gap. So the shape of a dimension-token set is already visible —
it is small, and it is about controls and chrome bands rather than about spacing everywhere. We are
holding off until a second product asks for the same handful, because one data point names a set that
happens to fit one design rather than the set products actually need.

## Semantic colour utilities

**The naming rule is mechanical:** every utility stem below is backed by the CSS custom property
`--lw-<stem>` — `brand` → `--lw-brand`, `surface-raised` → `--lw-surface-raised`, `on-negative` →
`--lw-on-negative`. The `--lw-*` names are what a tenant theme or `ctx.contributeTheme` overrides;
`theme.css` maps each to a Tailwind `--color-<stem>` so the utilities exist. Every token exists as
`bg-*`, `text-*`, `border-*`. Use **only** these names for colour — never raw hex/palette values.

**Not on Tailwind?** The stems in these tables are still your vocabulary — as CSS variables:
`surface-raised` is `var(--lw-surface-raised)` in your own stylesheet, `brand` is `var(--lw-brand)`
in a Bootstrap override. The pre-compiled `shell.css` already contains every utility the host chrome
itself uses, so the shell renders correctly without any of this.

### Brand / accent
| Utility stem       | Meaning                                     |
| ------------------ | ------------------------------------------- |
| `brand`            | primary brand (LoomWeaver blue) — logo/fills/icons |
| `brand-strong`     | brand, stronger (hover/active)              |
| `brand-text`       | brand as **text** — deeper tone, WCAG AA (≥4.5:1) on surfaces |
| `brand-fill`       | brand as a **filled surface with a label** (primary button) — deeper, so `on-brand` text stays AA |
| `on-brand`         | text colour **on** brand surfaces (contrast) |
| `accent`           | accent (gold)                               |
| `accent-strong`    | accent, stronger                            |

### Surfaces & borders (elevation ladder)
| Utility stem       | Meaning                                                      |
| ------------------ | ------------------------------------------------------------ |
| `surface`          | the app's base background                                    |
| `surface-raised`   | raised surface (card, active tab, panel body)                |
| `surface-overlay`  | overlay/popup/chrome controls (dropdown, toolbar buttons)    |
| `field`            | input-field background                                       |
| `border`           | default divider/border (`border-border`)                     |

### Text
| Utility stem       | Meaning                                     |
| ------------------ | ------------------------------------------- |
| `content`          | primary text                                |
| `content-muted`    | secondary text (labels, metadata)           |
| `content-faint`    | tertiary/decorative (placeholders, disabled)|

### States
| Utility stem       | Meaning                      |
| ------------------ | ---------------------------- |
| `positive`         | success / valid (green)      |
| `on-positive`      | text **on** `positive` surfaces (success button) |
| `negative`         | error / destructive (red) — error text & icon |
| `negative-fill`    | danger **button** fill — deeper than `negative`, so `on-negative` text stays AA |
| `on-negative`      | text **on** `negative` surfaces (danger button) |
| `caution`          | warning (amber)              |
| `on-caution`       | text **on** `caution` surfaces (warning button) |
| `info`             | info (blue)                  |
| `on-info`          | text **on** `info` surfaces (info button)        |

### Tooltip (special case, normally not used directly)
`tooltip` / `tooltip-content` — reserved for `<lw-tooltip>`.

### Typography
`--lw-font-sans` (the UI font, driving `body` plus Tailwind's `font-sans` utility) and `--lw-font-mono`
(code) are theme tokens as well — a theme/tenant can set the brand font through
`ctx.contributeTheme` / tenant CSS, like any colour. **Font *size* is deliberately NOT a token but a
user setting** (the built-in "text size" under Settings → Options scales the whole UI via the `:root`
`font-size`) — it is not part of the theme contract; branding and accessibility stay cleanly
separated.

## Host building blocks (`<lw-*>`) instead of hand work

- **Icons:** `<lw-icon name="add" size="1rem" />`. Names come from the semantic first-party registry
  `libs/core/shell/src/lib/elements/icon/loom-icons.ts` (e.g. `add`, `close`, `menu`, `chevronDown`,
  `check`, `reset`, `sort`, `info`). **Contributable names:** a **distribution** adds its
  own with `provideIcons({ name: svgRef })` (from `@loomweaver/shell`), a **weaver** adds them at runtime
  with `ctx.contributeIcons({ name: svg })`. A distribution may also **replace** a first-party glyph
  by naming it, and the replacement travels into sandboxed surfaces; a weaver never can, so an
  installed plugin cannot repaint the chrome. Contributed SVG is **sanitised** at registration (DOMPurify, SVG profile —
  `<script>`/event handlers/`javascript:` removed; markup that does not survive is discarded). A
  weaver then references the name in its contributions (`icon: 'name'`) **or** draws it directly by
  tag. **`<lw-icon>` is a framework-agnostic custom element**: it resolves the name
  through the **module-global** icon registry (no Angular DI, no `@ng-icons` runtime), so it is
  **usable inside your own weaver body too** (`schemas: [CUSTOM_ELEMENTS_SCHEMA]`). The SVG uses
  `currentColor` → `text-*` tokens colour it. `size` sets width/height; an unknown name renders nothing.
- **Tooltip (`<lw-tooltip>`):** a **framework-agnostic custom element** — like `<lw-icon>`,
  **usable inside your own weaver body** (by tag, no `@loomweaver/shell` import; in an Angular weaver set
  `schemas: [CUSTOM_ELEMENTS_SCHEMA]`). As the last child of a `class="relative"` trigger:
  ```html
  <button type="button" class="relative lw-icon-btn size-9">
    <lw-icon name="settings" size="1.25rem" />
    <lw-tooltip [text]="'settings.title' | transloco" position="bottom"></lw-tooltip>
  </button>
  ```
  Attributes: `text` (what is shown — a key **or** a literal; the host translates nothing), `position`
  (`top`|`bottom`|`left`|`right`), optionally `delay-ms`, `max-width`. Only shown on hover-capable
  pointers (never touch). The bubble is a **`[popover]` in the browser top layer** (the element calls
  `showPopover`) and is positioned **in JS** (no CSS anchor positioning): **cursor-anchored on mouse
  hover** (like a native `title` — it appears where the mouse is, which matters for wide triggers such
  as list rows), and anchored to the trigger element via `position` on **keyboard focus**. It is
  therefore **not** clipped by a `transform`/`overflow` ancestor (a virtual-scroll row) or by region
  z-order. The **look** lives as `.lw-tooltip-bubble` in `theme.css` (like `.lw-btn`), so it themes
  automatically.
- **Single-value selection (`<lw-select>` + `<lw-option>`):** a **framework-agnostic custom element**
  (like `<lw-tooltip>`) for "one value out of a set" (language, theme, settings) — a
  *select*, **not a menu** (actions are `<lw-menu>`). Options are **light-DOM children** (like native
  `<select><option>`), and it works in Angular **and** plain HTML/iframes:
  ```html
  <lw-select [attr.label]="'language.label' | transloco" [attr.value]="lang()" (lw-select-change)="onSelect($event)">
    @for (l of languages(); track l.value) {
      <lw-option [attr.value]="l.value" [attr.icon]="l.flag">{{ l.label }}</lw-option>
    }
  </lw-select>
  ```
  Attributes: `label` (accessible name), `value` (current value), `placeholder`, `disabled`;
  `<lw-option>`: `value`, optionally `icon` (v1 = a **literal glyph/emoji** — registry icon names
  follow with the `<lw-icon>` element), label = text content. The **`lw-select-change`** event
  (`detail.value`) fires **only on user selection**, not when `value` is set programmatically (no
  feedback loop). ARIA listbox keyboard handling (↑/↓/Home/End/Enter/Esc + typeahead) and CSS anchor
  positioning sit inside the element; the **look** lives as `.lw-select-*` in `theme.css`.
- **Menus/context menus (`<lw-menu>`):** on **host chrome** a weaver does **not** draw the menu itself
  — it contributes items through **`ctx.registerMenuItem({ menu, command, when? })`** into a named
  slot (e.g. `content/tab/context`), or attaches a `menu?` slot to its rail/bar/view item
  (region-agnostic); the host renders the `<lw-menu>` (a framework-agnostic custom element)
  at the cursor. The look lives as `.lw-menu*` in `theme.css`. Command-referenced (so it crosses the
  sandbox boundary), `when` = coarse context filtering. An item automatically shows its command's
  **icon + shortcut hint**; **`checkedWhen`** turns it into a **`menuitemcheckbox`** (e.g. "Pinned ✓" instead of a Pin/Unpin pair). **Exception — your own sandbox surface:** there the plugin
  draws `<lw-menu>` **itself** (from the frame UI kit — `/frame-kit/lw-elements.global.js` defines the whole `<lw-*>` family, `/frame-kit/lw-frame.css` supplies the compiled look) and
  positions it with **`openAt(x, y)`** at the iframe-local cursor — no cross-frame work, no RPC.
- **Buttons in bar/rail:** register them declaratively as a `BarButtonItem`/rail item (the host renders button + tooltip from data) — no need for your own button component per icon.
- **Buttons in content (dialogs, about/settings, toasts):** put the **`<lw-button>`** primitive on a
  real `<button>`/`<a>` — it keeps the native semantics and uses semantic tokens only:
  ```html
  <button lwButton variant="primary" (click)="save()">Save</button>
  <button lwButton variant="ghost" size="sm" iconOnly aria-label="…"><lw-icon name="close" size="1rem" /></button>
  ```
  Variants `primary` · `default` · `success` · `danger` · `warning` · `info` · `ghost`; sizes `md` (default) · `sm`; `iconOnly` = square.
  The directive must be in the component's `imports` (`imports: [LwButton]`, from `@loomweaver/shell`) —
  unlike the `<lw-button>` element and `.lw-btn` classes below, which need no import.
- **From an SDK-only plugin (`scope:weaver`):** the `lwButton` directive lives in the shell and is
  **not** importable across the Nx boundary. Two framework-free ways, both on the same `.lw-btn`
  contract and therefore theme-/tenant-reactive:
  ```html
  <!-- (a) the <lw-button> custom element — by tag, role=button + keyboard included -->
  <lw-button variant="primary" (click)="save()">Save</lw-button>
  <lw-button variant="ghost" size="sm" icon-only aria-label="…"><!-- icon --></lw-button>
  <!-- (b) the .lw-btn CSS class contract directly on a native <button> -->
  <button class="lw-btn lw-btn--primary">Save</button>
  <button class="lw-btn lw-btn--default lw-btn--sm">Cancel</button>
  ```
  The contract: base class **`lw-btn`** (which already carries the **default size `md`** — height,
  padding, font — so `lw-btn lw-btn--<variant>` alone already sits correctly) plus one variant
  modifier (`lw-btn--<variant>`); **`lw-btn--sm`** makes it smaller (optional), **`lw-btn--icon`**
  makes it square. **The variant names are `LwButtonVariant`** from `@loomweaver/plugin-sdk`. Defined in
  `theme.css`; the `lwButton` directive emits exactly these classes (**one source of truth**). There
  is **no** `lw-btn--md` — `md` is the default.
- **Icon buttons in chrome (`.lw-icon-btn`):** the shared core of the subtle icon buttons in host
  toolbars/strips (pane toolbar, tab-strip controls, sidebar header, panel actions): centred,
  `text-content-faint`, hover = `bg-surface-overlay` + `text-content`. **Size and radius stay a
  utility decision at the call site** (`h-6 w-6`, `rounded-md`, …) — the contract only supplies tone +
  hover in one place. For labelled buttons keep using `.lw-btn`.
- **Segmented selection (`.lw-segmented` / `.lw-segmented-item`):** a container with one button per
  option (theme mode, text size). The selected state hangs off **`aria-pressed`** — the a11y state
  *is* the style hook, there is no `--active` class. **Pitfall:** `.lw-segmented-item` is by contract
  a **square icon field** (7×7); for text segments override the size at the call site
  (`w-auto px-3 text-sm`) — "size stays per-site utilities", as with `.lw-icon-btn`.
  **Shared bar-control height:** `.lw-segmented` and `.lw-select-trigger` both pin `h-8.5`
  (34px) — controls standing next to each other in a bar are therefore the same height by
  construction; new bar controls should carry the same height.
- **Text fields (`.lw-field`):** put the class **`lw-field`** on a **native** `<input>` / `<textarea>` /
  `<input type="date">` — it themes through the tokens (tenant-/theme-reactive, like `.lw-btn`).
  `lw-field--invalid` marks a validation error. **Deliberately no wrapper element:** a native field
  already has full semantics, keyboard and a11y — unlike `<lw-select>`/`<lw-button>` (which
  encapsulate non-native elements), a text field only needs styling, not a web component (WC batch ①).
  `ctx.ui.prompt` uses the same contract.
- **Checkbox / toggle (`.lw-checkbox` / `.lw-switch`):** class contracts on a **native**
  `<input type="checkbox">` — `.lw-checkbox` themes the tick/fill via `accent-color`; `.lw-switch`
  draws a toggle switch (track = the input, knob = `::before`; add `role="switch"` in the markup).
  Native → full keyboard/a11y, no wrapper element. **Settings controls** use them: the `control.kind`
  values **`toggle`** (`.lw-switch`) and **`text`** (`.lw-field`) alongside
  `select`/`button`/`component` (WC batch ①).
- **Radio / slider (`.lw-radio` / `.lw-range`):** class contracts on a **native** `<input type="radio">`
  (`accent-color`, grouped via `name`) and `<input type="range">` (tinted thumb via the vendor
  pseudo-element). Native → arrow keys/a11y, no custom element. The settings `control.kind`
  **`slider`** (a number with `min`/`max`/`step`) renders `.lw-range` + a value readout (WC batch ③).
  A `role="slider"` needs an accessible name (`aria-label`).
- **Progress (`.lw-progress` / `<lw-progress-ring>`):** the **bar** = `.lw-progress` on a **native**
  `<progress value max>` (class contract; `role="progressbar"` + a11y are native, only fill/track are
  tinted). The **ring** = `<lw-progress-ring value max size>` as a custom element (there is no native circular element; it shows the percentage in the centre; `size` is a **CSS length** such as `2.5rem` [default] — a bare number is invalid and silently discarded by the browser). **Both need
  an accessible name** (`aria-label`/`aria-labelledby`, WCAG `aria-progressbar-name`). Indeterminate =
  `<lw-spinner>` (WC batch ②).
- **Badge (`.lw-badge`):** a status/count pill on a `<span>` (class contract, pure presentation, no
  custom element). Tints `.lw-badge--brand/--success/--danger` alongside the neutral base (WC batch ②).
- **Divider / collapsible (`.lw-divider` / `.lw-collapsible`):** class contracts on a **native** `<hr>`
  (implicit `role="separator"`; `.lw-divider--vertical` for a vertical line) and a **native**
  `<details>`/`<summary>` — native expand/collapse semantics, keyboard and a11y **without JS**; the
  class tints header + body (`.lw-collapsible-body`) and replaces the marker with a chevron that
  rotates on `[open]` (WC batch ④).
- **The pattern for future `<lw-*>` primitives:** wherever a host building block should also be usable
  by plugins, its appearance lives as a **`.lw-*` CSS class contract** in `theme.css` (the Bootstrap
  principle: styles only), and the Angular component/directive is the thin wrapper on top. That keeps
  the contract consumable across the Nx boundary without a `@loomweaver/ui` import kit (refining the boundary).

## Busy indicator

- **`<lw-spinner size="1.5rem" [label]="…" />`** — a pure CSS spinner on `currentColor` (brand colour
  by default). Used by the progress dialog (`ctx.ui.progress`/`withProgress`), and anywhere else for
  "this is running".

## Rich text / Markdown

- **`<lw-markdown source="…">`** — a **framework-agnostic custom element** (like `<lw-tooltip>`/`<lw-select>`/`<lw-menu>`): it renders Markdown as **sanitised** HTML (via `marked` +
  **DOMPurify**) with Tailwind Typography styling. No formatting logic of your own. Usable in the
  **weaver body** by tag as well (no `@loomweaver/shell` import; set `CUSTOM_ELEMENTS_SCHEMA`). Angular
  property binding `[source]` and plain HTML `source="…"` drive the same render. It uses the
  **`prose-lw`** utility (in `theme.css`), which maps the `--tw-prose-*` colours onto our `--lw-*`
  tokens → it **flips automatically in dark mode** (no `prose-invert`/`dark:`).
- For formattable text in dialogs/about/plugin content, always use `<lw-markdown>` instead of hand-written HTML.

## Popups from clipped regions (overflow-hidden)

Bar/panel headers have `overflow-hidden`. An absolutely positioned popup is **clipped** there.
The fix: `position: fixed` + CSS anchor positioning — `anchor-name` on the trigger, `position-anchor` +
`position-area` on the popup. Example: `<lw-select>` (`libs/core/shell/src/lib/elements/select/lw-select.element.ts`
sets `anchor-name`/`position-anchor`; the `position-area` lives in `libs/core/shell/src/lib/styles/theme.css`).

**Caution — a `transform` ancestor beats `position: fixed`:** if an ancestor has a `transform` (e.g. a
CDK virtual-scroll row with `translateY`), it becomes the *containing block* for `fixed` → the popup
positions relative to it and **is** clipped by its `overflow` after all. Only the **browser top layer**
escapes that: `<lw-tooltip>` uses a **`[popover]`** (`showPopover`) for it and positions the bubble
**in JS** (at the cursor on mouse hover, otherwise at the element — no CSS anchor positioning). If a
popup must be a child of a potentially `transform`ed ancestor, take the same route; otherwise the
body-appended `<lw-menu>` (`MenuService`) or `position: fixed` is enough.

## Your own CSS classes

Hand-written CSS in components is named with an `lw-` prefix (`.lw-tooltip-bubble`, `.lw-scrim`).
The ESLint guardrail ignores `^lw-` — those are **not** Tailwind utilities.

## Guardrail

`eslint-plugin-better-tailwindcss` runs in the `nx lint` gate over `**/*.html`:
- `no-unregistered-classes` (**error**) — reports mistyped/non-existent utilities
  (ignores `^lw-` and Angular structure like `ng-*`).
- `enforce-consistent-class-order` (**warn**) — stable class order, `--fix`-able.

Entry point for class resolution: `apps/loom-testbed/src/styles.css`
(configured in `eslint.config.mjs`).
