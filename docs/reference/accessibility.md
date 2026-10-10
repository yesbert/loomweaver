# Accessibility (a11y)

<!-- derived-from-specs -->

> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/`. For this page: `accessibility`. Where this page and a specification
> disagree, the specification is right, and that is a defect in this page: change the behaviour
> there, then explain it here.

**The workbench meets WCAG 2.1 Level AA.** An axe audit over its principal screens checks what a
machine can check, and the rules on this page hold the rest. Accessibility lives in the **core**, so every weaver that uses the host
vocabulary inherits it automatically, the same way it inherits the permission broker. This file is
the binding guardrail; it complements [`design-tokens.md`](design-tokens.md) (colours/contrast).

## What the platform already brings (inherited)

- **Landmarks:** a banner for the top row of bars, `<nav>` for the rail, and one `<main>` for the
  content area however it is split. Each side panel is a named `<aside>`, and the bars at the bottom
  share one `<footer>`. Each landmark is named in the interface language, and each bar inside a
  row is a named group rather than a landmark of its own. Every pane body is a `tabpanel` named by
  its active tab, which names the panel back with `aria-controls`. Where a side panel's header
  floats in the top row, its strip lies in the banner rather than in the panel's region.
- A **skip-to-content link** as the first tab stop. It moves the focus to the working area without
  navigating, so it works at every address and under any base, and leaves the address and unsaved
  work as they were.
- **Dialog fields:** the text field of `prompt` is named by its question, and the field of a
  `confirm` with `requireConfirmation` by the requirement's label. A reason the guard shows is
  announced as the field's description, and the field is marked invalid while it is shown.
- **Focus:** visible `focus-visible` ring; dialogs have a **focus trap** + focus restore; popups/menus
  follow the **ARIA menu keyboard pattern** (arrow keys/Home/End, Escape closes, focus returns to the trigger).
- **Live regions:** toasts announce with `role="alert"`/`"status"` depending on urgency.
- **Timed toasts:** a toast of the error kind stays until it is dismissed. Every other toast leaves
  by itself, but not once the pointer moves on a toast or while keyboard focus is in one, and it
  stays at least a second after that. Every toast has a dismiss button the keyboard reaches. The kind shows
  in the icon as well as in the colour. A distribution that draws toasts itself
  (`drawToasts: false`) takes over announcing them, and the pairing and the motion of its own look.
- **Motion:** `prefers-reduced-motion` is respected globally (non-essential transitions/animations
  collapse; the loading spinner stays, as essential status feedback).
- **Contrast:** all semantic tokens are **AA-verified** (see the token rules below).
- **Tab strips:** every pane strip is a real `role="tablist"` with `role="tab"` children. Because ARIA
  specifies `tab` as "children presentational", the **close and unpin controls on a tab are not
  focusable buttons** but pure pointer affordances (`aria-hidden`). The keyboard equivalent is
  **`Delete`** on the focused tab (announced via `aria-keyshortcuts`), plus the tab context menu.
  A strip is **one tab stop**: Tab enters it on the selected tab and the next Tab leaves it. Inside,
  the left and right arrow keys move the focus from tab to tab and wrap at the ends, Home and End
  jump to the first and the last. Moving the focus chooses nothing; Enter or Space chooses the
  focused tab. `Alt` with an arrow still reorders.
- **Toolbars:** a `<lw-toolbar>` is a `role="toolbar"` and **one tab stop**. Inside, the left and
  right arrow keys move between its controls and wrap at the ends, Home and End jump to the first
  and the last. It is announced by the placement's `label`, or by the title the toolbar was
  registered with, worded by the workbench. The name follows a change of the label and of the
  language, and the `label` attribute keeps what was written there. When the row is too narrow, the controls that do not fit fold into a **More**
  control rather than being cut off.
- **Text size (WCAG 1.4.4):** the shell ships a user setting "text size"
  (Settings → Options → General) that scales the whole UI through the `:root` `font-size`
  (90/100/112.5/125 %, **relative** to the browser's base font). Every distribution inherits it.
- **Automated net:** an **axe-core E2E** (`platform/apps/loom-testbed-e2e/src/a11y.spec.ts`) checks every core
  screen against WCAG 2.1 A/AA and turns the nightly CI red as soon as a violation appears.

## Rules for plugin authors (checklist)

1. **Use the host vocabulary** (`<lw-button>`, dialogs via `ctx.ui.*`, `<lw-icon>`, `<lw-markdown>` …):
   it is already accessible (focus, contrast, keyboard). A web component or an iframe of your own is
   the last rung of the ladder, for the graphics that vocabulary does not cover, and there everything
   the host brings is yours to build and to keep. What else it costs is in
   [your own custom element](../weaver/sidebar-surfaces.md#your-own-custom-element--the-escape-hatch).
2. **An accessible name for everything interactive:** visible text **or** `aria-label`. Icon-only
   buttons **require** `aria-label`.
3. **Semantic colour tokens only** (never raw hex). In particular:
   - Brand blue as **text** → `text-brand-text` (not `text-brand`, which is AA only as a fill/icon).
   - Filled **action surfaces with a label** → use the `<lw-button>` variants (they carry the
     AA-capable `*-fill` tones); do **not** build `bg-brand` + text yourself.
4. **Never rely on colour alone.** Convey state through an icon, a text or a shape as well.
5. **Keyboard:** everything reachable by Tab; your own menus/popups follow the ARIA pattern (arrow
   keys, Escape, focus restore). Never write `role="menu"` without the keyboard behaviour, because a
   role without its behaviour is worse than no role.
6. **Motion:** reduced-motion is inherited; gate your own animations behind the media query too.
7. **Images:** meaningful `alt`; purely decorative ones → `alt=""`.
8. **Font sizes in `rem`, never in `px`.** The text-size setting works through the `:root`
   `font-size`, so sizing text in `px` **silently** opts out of the user's choice, and ignores an
   enlarged browser base font. Tailwind's `text-*` utilities are already `rem`, so: use the
   utilities and avoid raw `px` font sizes.

## Colour token rules (AA)

| Purpose                 | Token                                         | Rule                                                                                         |
| ----------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Body text / labels      | `content` / `content-muted` / `content-faint` | all ≥4.5:1 on every surface                                                                  |
| Brand as **text**       | `brand-text`                                  | deeper tone, ≥4.5:1 (not `brand`)                                                            |
| Brand as **fill+label** | `brand-fill` (+ `on-brand`)                   | primary-button fill; `brand` stays the identity (logo/icon)                                  |
| Danger **button**       | `negative-fill` (+ `on-negative`)             | deeper than `negative`; `negative` stays error text/icon                                     |
| Status icons/text       | `positive`/`negative`/`caution`/`info`        | ≥3:1 as an icon; ≥4.5:1 as text                                                              |
| Unsaved work            | `unsaved`                                     | ≥3:1 on every surface, as a graphical indicator rather than as text                          |
| Borders/dividers        | `border`                                      | decorative (exempt from 1.4.11); interaction boundaries additionally carry a focus ring/fill |

## Checking

- `nx e2e loom-testbed-e2e` runs the axe net. For a **new screen/state**, add an
  `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` scan
  (import `AxeBuilder` from `@axe-core/playwright`). The existing scans in
  `platform/apps/loom-testbed-e2e/src/a11y.spec.ts` are the template to copy.
- **axe only covers what a machine can check**, roughly a third to a half of what WCAG asks for:
  labels, contrast, ARIA, roles. **Test focus order, keyboard completeness and meaningful alt text by
  hand.**
