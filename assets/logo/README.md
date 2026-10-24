# Logo

Flat, two values, no gradient. The form is the plain picture-in-picture signal: an open frame with a smaller landscape window inside it. Generic iconography, no platform asset anywhere.

## Files

| File               | Use                                                           |
| ------------------ | ------------------------------------------------------------- |
| `mark.svg`         | Ink tile, white glyph. Extension icon, store listing, favicon |
| `mark-inverse.svg` | White tile, ink glyph. Dark backgrounds, print                |
| `mark-mono.svg`    | `currentColor` line art, no tile. Docs, one-colour printing   |

`public/icon/*.png` is generated from `mark.svg` and is what the manifest loads.

## Colour

Ink `#111111` on white. Nothing else.

## Geometry

Canvas 512. Frame path 112–400, corner radius 72, stroke 34. Window 136×88 at (208, 256), radius 26. Window gap to the frame's inner edge: 26 on the right and bottom.

`mark-mono.svg` uses stroke 30 because it has no tile to hold the weight.

## Platform limits

From Meta's Instagram brand guidelines (read 2026-10-24):

- Using the Instagram glyph or gradient in this icon would make their brand the most prominent feature and imply endorsement. Both are named as prohibited.
- The word Instagram may only be used descriptively, as in "for Instagram".
- Do not abbreviate Instagram ("ig") or combine it with another brand or a generic term.

Consequences:

- Ship name: descriptive, for example "PiP for Instagram Calls". Not "Instagram PiP", not "ig-pip".
- Keep the package and repo name free of Instagram, and free of "ig" if it can be avoided.
- Never copy files from `IG_brand_asset_pack_2023.zip` into the extension.
- No permission request is needed for a browser extension. Permission only applies to broadcast, radio, out-of-home, and print larger than A4.

## Not done

- No wordmark.
- No trademark search.
