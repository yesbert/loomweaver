# LoomWeaver — accessibility (a11y)

<!-- derived-from-specs -->
> **This is a guide, not the contract.** What the platform guarantees is specified under
> `openspec/specs/` — for this page: `accessibility`. Where this page and a specification
> disagree, the specification is right, and that is a defect in this page: change the behaviour
> there, then explain it here.

**Target: WCAG 2.1 Level AA.** a11y lives in the **core** — every weaver that uses the host
vocabulary inherits it automatically (the same way it inherits the permission broker). This file is
the binding guardrail; it complements [`design-tokens.md`](design-tokens.md) (colours/contrast).

## What the platform already brings (inherited)

- **Landmarks:** `<header>` (bar) · `<nav>` (rail) · `<main>` (content) · `<aside>` (panel) + a
  **skip-to-content link** as the first tab stop.
- **Focus:** visible `focus-visible` ring; dialogs have a **focus trap** + focus restore; popups/menus
  follow the **ARIA menu keyboard pattern** (arrow keys/Home/End, Escape closes, focus returns to the trigger).
- **Live regions:** toasts announce with `role="alert"`/`"status"` depending on urgency.
- **Motion:** `prefers-reduced-motion` is respected globally (non-essential transitions/animations
  collapse; the loading spinner stays, as essential status feedback).
- **Contrast:** all semantic tokens are **AA-verified** (see the token rules below).
- **Tab strips:** every pane strip is a real `role="tablist"` with `role="tab"` children. Because ARIA
  specifies `tab` as "children presentational", the **× (close) and 📌 (unpin) are not focusable
  buttons** but pure pointer affordances (`aria-hidden`); the keyboard equivalent is **`Delete`** on
  the focused tab (announced via `aria-keyshortcuts`), plus the tab context menu.
- **Text size (WCAG 1.4.4):** the shell ships a user setting "text size"
  (Settings → Options → General) that scales the whole UI through the `:root` `font-size`
  (90/100/112.5/125 %, **relative** to the browser's base font). Every distribution inherits it.
- **Automated net:** an **axe-core E2E** (`platform/apps/loom-testbed-e2e/src/a11y.spec.ts`) checks every core
  screen against WCAG 2.1 A/AA and turns the nightly CI red as soon as a violation appears.

## Rules for plugin authors (checklist)

1. **Use the host vocabulary** (`<lw-button>`, dialogs via `ctx.ui.*`, `<lw-icon>`, `<lw-markdown>` …) —
   it is already accessible (focus, contrast, keyboard). Your own web component/iframe is an emergency
   exit only — and it costs more than accessibility work, see
   [your own custom element](../weaver/sidebar-surfaces.md#your-own-custom-element--the-escape-hatch).
2. **An accessible name for everything interactive:** visible text **or** `aria-label`. Icon-only
   buttons **require** `aria-label`.
3. **Semantic colour tokens only** (never raw hex). In particular:
   - Brand blue as **text** → `text-brand-text` (not `text-brand`, which is AA only as a fill/icon).
   - Filled **action surfaces with a label** → use the `<lw-button>` variants (they carry the
     AA-capable `*-fill` tones); do **not** build `bg-brand` + text yourself.
4. **Never rely on colour alone** — also convey state through an icon/text/shape.
5. **Keyboard:** everything reachable by Tab; your own menus/popups follow the ARIA pattern (arrow
   keys, Escape, focus restore) — never `role="menu"` without the keyboard behaviour (a role without
   its behaviour is worse than no role).
6. **Motion:** reduced-motion is inherited; gate your own animations behind the media query too.
7. **Images:** meaningful `alt`; purely decorative ones → `alt=""`.
8. **Font sizes in `rem`, never in `px`.** The text-size setting works through the `:root`
   `font-size` — sizing text in `px` **silently** opts out of the user's choice (and ignores an
   enlarged browser base font). Tailwind's `text-*` utilities are already `rem`, so: use the
   utilities and avoid raw `px` font sizes.

## Colour token rules (AA)

| Purpose                       | Token                       | Rule |
| ----------------------------- | --------------------------- | ----- |
| Body text / labels            | `content` / `content-muted` / `content-faint` | all ≥4.5:1 on every surface |
| Brand as **text**             | `brand-text`                | deeper tone, ≥4.5:1 (not `brand`) |
| Brand as **fill+label**       | `brand-fill` (+ `on-brand`) | primary-button fill; `brand` stays the identity (logo/icon) |
| Danger **button**             | `negative-fill` (+ `on-negative`) | deeper than `negative`; `negative` stays error text/icon |
| Status icons/text             | `positive`/`negative`/`caution`/`info` | ≥3:1 as an icon; ≥4.5:1 as text |
| Borders/dividers              | `border`                    | decorative (exempt from 1.4.11); interaction boundaries additionally carry a focus ring/fill |

## Checking

- `nx e2e loom-testbed-e2e` runs the axe net. For a **new screen/state**, add an
  `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()` scan
  (import `AxeBuilder` from `@axe-core/playwright`) — the existing scans in
  `platform/apps/loom-testbed-e2e/src/a11y.spec.ts` are the template to copy.
- **axe only covers what a machine can check** (~⅓–½): labels, contrast, ARIA, roles. **Test focus
  order, keyboard completeness and meaningful alt text by hand.**
