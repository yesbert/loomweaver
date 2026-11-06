## 1. Formatted text carries no style and no forms

- [x] 1.1 Test first: an overlay drawn with a `style` attribute and a credential form are gone after rendering, and ordinary Markdown (headings, lists, links, code, images) is unchanged (the Markdown element's spec)
- [x] 1.2 The Markdown element's sanitiser forbids `style` and the form tags and attributes (`form`, `input`, `button`, `select`, `textarea`, `option`, `label`, `fieldset`, `action`, `formaction`, `method`)
- [x] 1.3 Every place that renders plugin-supplied Markdown goes through that element: the frame kit registers it for sandboxed surfaces, the plugin store's details and the dialogs use its tag; nothing else parses Markdown
- [x] 1.4 The element's JSDoc, `docs/reference/design-tokens.md` (Rich text / Markdown) and `llms-full.txt` list what is stripped
- [x] 1.5 ui-primitives delta: the sanitising requirement, whole, with a scenario for style and forms and one for ordinary text

## 2. The address form is a guarantee

- [x] 2.1 routing delta: values decoded, paths in the encoded form, an encoded segment stays one segment and one tab, stated as the published descriptions and the content-area guide say
- [x] 2.2 Evidence, no code change: `content-path.spec.ts` (a segment written with encodeURIComponent stays one segment and hands the value back; values are decoded), `tab-opening.service.spec.ts` (one tab for an encoded address, value handed back; a path with characters the address encodes opens one tab the address finds), `content-tab-state.spec.ts` (values of an encoded address decoded, path encoded), `live-surface-route.spec.ts` (values decoded, segments as the address holds them; a value that is no encoding read as it stands), `iframe-surface.spec.ts` (the remainder below an encoded tab root), `content-route-table.spec.ts` (an encoded slash stays inside its segment)

## 3. Verification

- [x] 3.1 `openspec validate plugin-markdown-and-the-address-form --strict`, shell lint and tests, packaging, the frame-kit bundle, the docs and contract guards, the production build
