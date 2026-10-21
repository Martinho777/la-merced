# Contrast

Every pairing the UI is allowed to use, measured with the WCAG 2.2 formula in both themes. Text needs **4.5:1** (AA); controls, borders, focus rings and icons need **3:1**. If a pairing is not on these lists, it is not allowed: ask before adding it.

## Text pairings (need 4.5:1)

| Pairing | Used for | Light | High contrast |
|---|---|---|---|
| `ink` on `surface` | Body text | 17.75:1 ✅ AA · AAA | 21.00:1 ✅ AA · AAA |
| `ink` on `surface-sunken` | Text on stucco areas and pressed cards | 16.28:1 ✅ AA · AAA | 21.00:1 ✅ AA · AAA |
| `ink` on `yellow-50` | Text in Santi bubble / pressed card (high contrast) | 16.59:1 ✅ AA · AAA | 19.44:1 ✅ AA · AAA |
| `ink` on `yellow-400` | Primary button label | 12.11:1 ✅ AA · AAA | 14.33:1 ✅ AA · AAA |
| `ink` on `green-400` | Text on Santi-green fills | 8.75:1 ✅ AA · AAA | 10.35:1 ✅ AA · AAA |
| `ink` on `sky-400` | Accent button label | 7.16:1 ✅ AA · AAA | 8.47:1 ✅ AA · AAA |
| `ink` on `sky-50` | Text in info/audio panel | 16.08:1 ✅ AA · AAA | 19.02:1 ✅ AA · AAA |
| `ink` on `red-50` | Text in error banner | 15.70:1 ✅ AA · AAA | 18.58:1 ✅ AA · AAA |
| `ink` on `green-50` | Text in success banner | 16.33:1 ✅ AA · AAA | 19.32:1 ✅ AA · AAA |
| `ink-muted` on `surface` | Secondary text | 7.63:1 ✅ AA · AAA | 14.16:1 ✅ AA · AAA |
| `ink-muted` on `surface-sunken` | Secondary text on stucco and pressed cards | 7.00:1 ✅ AA | 14.16:1 ✅ AA · AAA |
| `ink-muted` on `yellow-50` | Secondary text in pressed card (high contrast) | 7.13:1 ✅ AA · AAA | 13.10:1 ✅ AA · AAA |
| `yellow-800` on `surface` | Eyebrow label | 5.76:1 ✅ AA | 9.60:1 ✅ AA · AAA |
| `yellow-800` on `yellow-50` | Brand badge | 5.38:1 ✅ AA | 8.89:1 ✅ AA · AAA |
| `orange-700` on `surface` | Warning text and icons | 5.71:1 ✅ AA | 7.81:1 ✅ AA · AAA |
| `orange-700` on `orange-50` | Warning text in warning banner | 5.16:1 ✅ AA | 7.06:1 ✅ AA · AAA |
| `ink` on `orange-50` | Text in warning banner | 16.03:1 ✅ AA · AAA | 18.97:1 ✅ AA · AAA |
| `green-700` on `surface` | Success text | 5.37:1 ✅ AA | 8.11:1 ✅ AA · AAA |
| `green-700` on `green-50` | Success badge | 4.94:1 ✅ AA | 7.47:1 ✅ AA · AAA |
| `red-600` on `surface` | Error text | 5.52:1 ✅ AA | 7.55:1 ✅ AA · AAA |
| `red-800` on `red-50` | Error text in error banner | 7.86:1 ✅ AA · AAA | 7.86:1 ✅ AA · AAA |
| `sky-700` on `surface` | Links, info text | 5.43:1 ✅ AA | 8.70:1 ✅ AA · AAA |
| `sky-700` on `sky-50` | Info text in info panel | 4.92:1 ✅ AA | 7.88:1 ✅ AA · AAA |
| `surface` on `red-600` | Number in essential marker | 5.52:1 ✅ AA | 7.55:1 ✅ AA · AAA |
| `surface` on `green-700` | Check in completed marker | 5.37:1 ✅ AA | 8.11:1 ✅ AA · AAA |
| `surface` on `sky-700` | Text on dark info button | 5.43:1 ✅ AA | 8.70:1 ✅ AA · AAA |
| `surface` on `ink` | Text on ink header/toast | 17.75:1 ✅ AA · AAA | 21.00:1 ✅ AA · AAA |
| `ink` on `yellow-400` | Number in optional marker | 12.11:1 ✅ AA · AAA | 14.33:1 ✅ AA · AAA |

## Non-text pairings (need 3:1)

| Pairing | Used for | Light | High contrast |
|---|---|---|---|
| `border-strong` on `surface` | Control borders, selected card border | 4.14:1 ✅ AA | 8.86:1 ✅ AA |
| `border-strong` on `surface-sunken` | Input border on stucco, selected card while pressed | 3.80:1 ✅ AA | 8.86:1 ✅ AA |
| `yellow-600` on `surface` | Primary button edge | 3.49:1 ✅ AA | 21.00:1 ✅ AA |
| `ink-subtle` on `surface` | Inactive icons | 4.14:1 ✅ AA | 8.86:1 ✅ AA |
| `focus` on `surface` | Focus ring | 5.43:1 ✅ AA | 21.00:1 ✅ AA |
| `focus` on `yellow-400` | Focus ring around primary button | 3.71:1 ✅ AA | 14.33:1 ✅ AA |

## Banned pairings

These fail and must never appear, even for large text:

| Pairing | Why it shows up | Light |
|---|---|---|
| `surface` on `yellow-400` | White on yellow | 1.47:1 ❌ |
| `ink-muted` on `yellow-400` | Grey on yellow | 5.20:1, banned by rule: 400 fills carry `ink` only |
| `surface` on `green-400` | White on Santi green | 2.03:1 ❌ |
| `surface` on `sky-400` | White on sky | 2.48:1 ❌ |
| `yellow-400` on `surface` | Yellow text | 1.47:1 ❌ |
| `green-400` on `surface` | Santi-green text | 2.03:1 ❌ |
| `red-400` on `surface` | Santi-red text | 3.61:1 ❌ |
| `surface` on `red-400` | White numbers on Santi red | 3.61:1 ❌ |
| `ink-subtle` on `surface` | ink-subtle as running text | 4.14:1 ❌ |

## Rules of thumb

- On any **light fill** (white, stucco, any 50/100 tint, yellow-400, green-400, sky-400) text is `ink`, `ink-muted` (not on the 400 fills), or a family's 700–900 step.
- On any **dark fill** (`ink`, `green-700`, `red-600`, `sky-700`) text is `surface` (white).
- The 400 brand colors are **fills, never text**. Santi's own colors (`green-400`, `red-400`, `santi-beak`) never carry text.
- Color never carries meaning alone: completed points also get a check, essential vs optional also differ by solid vs dashed ring, errors also get an icon and text.
