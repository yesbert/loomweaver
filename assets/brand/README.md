# LoomWeaver — Brand Assets

The LoomWeaver mark is a **woven mat**: blue warp threads with **gold accent threads woven through**
— the visual metaphor for plugins (the gold) woven into the platform (the blue warp).

## Files

| File | Use |
|------|-----|
| `loomweaver-logo.svg` | Scalable master (wordmark + icon). Prefer this wherever vector works. |
| `loomweaver-logo-full.png` | Wordmark + icon raster, with padding. |
| `loomweaver-logo-full-nobuffer.png` | Wordmark + icon raster, tight crop. |
| `loomweaver-icon.png` | Icon only (app icon, favicon source, avatar). |

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
