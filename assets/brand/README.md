# LoomWeaver — Brand Assets

The LoomWeaver mark is a **woven mat**: blue warp threads with **gold accent threads woven through**
— the visual metaphor for plugins (the gold) woven into the platform (the blue warp).

## Files

| File | Use |
|------|-----|
| `loomweaver-logo.svg` | Scalable master (wordmark + icon). Prefer this wherever vector works. |
| `loomweaver-logo-full.png` | Wordmark + icon raster, with padding. |
| `loomweaver-logo-full-nobuffer.png` | Wordmark + icon raster, tight crop. |
| `loomweaver-icon.png` | Icon only, 1280×1117. The header logo on the site; not square, so never a favicon. |
| `icon-512.png` | Square icon master. Every size below is scaled from this one. |
| `icon-192.png` | Web app manifest, Android home screen. |
| `icon-180.png` | `apple-touch-icon`. |
| `icon-32.png` | Favicon. |
| `social-card.svg` | Source of the social preview card, 1200×630. |
| `social-card.png` | What `og:image` and `twitter:image` point at. Rendered from the SVG, committed. |

The card and the icons are **committed raster files, rendered once by hand**, not build output. The
site uses Astro's passthrough image service on purpose, so that `sharp` and its LGPL libvips binary
never enter the tree; anything that rendered an image during the build would undo that. Redraw
`social-card.svg`, then re-render it and the icon sizes:

```bash
sips -s format png social-card.svg --out social-card.png
for s in 32 180 192; do cp icon-512.png icon-$s.png && sips -Z $s icon-$s.png; done
```

`website/tools/sync-docs.mjs` copies all of them into the site and **fails the build if one is
missing**, so a deleted card is a red build rather than a blank preview nobody notices.

## Colors

| Token | Hex | RGB |
|-------|-----|-----|
| LoomWeaver Blue (primary) | `#2E96C9` | `46, 150, 201` |
| LoomWeaver Gold (accent)  | `#C59A2F` | `197, 154, 47` |

These are the seed values for the design-token system (primitive → semantic) described in the
plugin-architecture design doc (theming section).

## Distribution brands

A LoomWeaver installation presents as exactly one **product**. Files in this folder are
the bare-platform LoomWeaver brand; each distribution's brand lives in its own subfolder:

| Folder | Distribution |
|--------|--------------|
| `treeweaver/` | TreeWeaver Studio — first dogfooding distribution (source of truth: the TreeWeaver repo; mirrored here while it is developed in-tree). |
