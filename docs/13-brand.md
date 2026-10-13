# 13 · Brand

## The mark: Stepped Bean

A coffee bean whose centre crease is a rising staircase, like a bar chart. Coffee and counting in one shape.

| File | Use |
|---|---|
| [`components/BrandMark.tsx`](../components/BrandMark.tsx) | `<BrandMark />` (colour from `currentColor`) and `<BrandLockup />` (mark + name) for anything in the app |
| `public/brand/bean-counter-mark.svg` | Amber mark, for dark backgrounds |
| `public/brand/bean-counter-mark-navy.svg` | Navy mark, for light backgrounds |
| `public/brand/bean-counter-mark-black.svg` / `-white.svg` | One-colour versions (print, stamps, overlays) |
| `public/brand/bean-counter-mark-small.svg` | Simplified two-step crease for sizes under 24 px |
| `public/brand/bean-counter-app-icon.svg`, `icon-192.png`, `icon-512.png` | Navy tile + amber mark, for the PWA manifest and emails |
| `public/brand/bean-counter-favicon.svg` | Tile with the small cut, copied to `app/icon.svg` |
| `app/favicon.ico` (16/32/48), `app/icon.svg`, `app/apple-icon.png`, `app/manifest.ts` | Picked up automatically by Next.js |

## Colour

| Name | HEX | RGB | Use |
|---|---|---|---|
| Amber | `#fca311` | 252 163 17 | Mark on navy / dark backgrounds |
| Navy | `#14213d` | 20 33 61 | Mark on white / light backgrounds, icon tile |

Amber on white is only about 2:1 contrast, so on light backgrounds use navy. In the app, `text-primary` handles this automatically: navy in light mode, amber in dark mode.

## Rules

- **Clear space:** at least one crease step (about 10% of the mark's height) on every side.
- **Minimum size:** full mark 24 px; below that, use the small cut (`<BrandMark small />`).
- **Name:** "Bean Counter", two words, both capitalised. Set in Geist, semibold, next to the mark.
- **Don't** recolour the mark outside the palette, outline it, add effects, rotate it, or straighten the bean. The 30° tilt is part of the shape.

## Open items

- The wordmark is live text (Geist), not outlined paths. For print or external use, convert it to outlines in a vector editor.
- No trademark search has been done.
