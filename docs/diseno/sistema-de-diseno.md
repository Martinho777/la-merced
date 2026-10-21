# La Merced

The design system of the La Merced digital heritage guide: a light web app that visitors open on their own phones, in front of the church, often in strong sun and on weak mobile data. It takes its color from the facade itself (the yellow walls, the white stucco ataurique, the sky above it) and its personality from Santi, the quetzal guide.

This README is the source of truth for the code theme. Token names here are the CSS custom property names (`--yellow-400`, `--space-4`, `--radius-lg`…). Contrast for every allowed color pairing is in the **Contrast** section; component specs are in **Components**.

## Principles

1. **The building first, the screen second.** The app exists to make people look up at the facade. Screens are quick to read and get out of the way: one main action per screen, generous white space, no decorative noise.
2. **Playful frame, calm content.** Santi, the chunky 3D buttons, celebrations and bright fills live on navigation, welcome and reward moments. Content screens (the ficha, transcripts, sources) are calm: white, ink text, no bounce.
3. **Readable outside.** Running text is never under 16px, always ink or ink-muted on light surfaces, and every pairing passes WCAG 2.2 AA. A high-contrast theme exists for visitors who need it.
4. **Honest and respectful.** Historical uncertainty is shown, not hidden. Inside the church, the interface goes quiet (respect mode: no sound, no celebration).

## Voice

- Spanish first, then Kaqchikel and English; every string comes from the translation files, never hard-coded.
- Short, warm, second person ("Elige tu zona", "Toca un detalle"). Santi speaks in exclamations; the interface does not.
- Sentence case everywhere except `label` eyebrows (uppercase).
- Numbers as digits: "3 / 12 detalles", "50 min".

## Color

### Roles

| Role | Token | Notes |
|---|---|---|
| Background | `surface` (#FFFFFF) | Pure white base, chosen for a clean, bright feel. |
| Stucco areas | `surface-sunken` (#F7F5EF) | Map backdrop, audio bar, inputs, grouped sections. |
| Text | `ink` (#151917) | Almost black, with a faint green warmth so it sits well next to the yellow; softer than pure black. |
| Secondary text | `ink-muted` (#4F5552) | The only grey allowed for readable text. |
| **Lead color** | `yellow-400` (#FCD13F) | La Merced's facade yellow: primary buttons, active states, progress. |
| Secondary accent | `sky-400` (#5AAAF2) | The sky over the facade: "Ver cómo era", the audio play button, info moments. |
| Santi | `green-400`, `red-400`, `santi-beak`, `santi-eye` | Sampled from the mascot. Mascot and celebration only. |
| States | `success` (green-700), `error` (red-600), `info` (sky-700), `warning` (orange-700) | Always paired with an icon and words. |

### Allowed variations

Each family has **only** the steps in `tokens.json`. Do not invent in-between shades, do not lighten with opacity, and do not use `color-mix()` for UI colors. What each step is for:

| Step | Purpose |
|---|---|
| 50 | Tinted backgrounds (banners, Santi bubble). |
| 100 | Hover / pressed on a 50 tint; progress track. |
| 200 | Decorative only (illustrations). |
| 400 | The family's identity color, used **as a fill**. Text on it is `ink`. |
| 500–600 | Pressed fills and 3D edges (non-text, 3:1). |
| 700–900 | The family's **text** colors on light surfaces. |

Use semantic aliases in components (`brand`, `brand-edge`, `brand-tint`, `accent`, `link`, `focus`, `point-*`, `success`, `error`…) instead of raw steps, so the high-contrast theme can swap them.

### Proportion

On any screen, roughly: 70% white and stucco, 20% ink text, under 10% yellow, with sky, green and red as small touches. If a screen looks yellow, there is too much yellow.

### Themes

- **Light** (default).
- **High contrast**: black ink, black borders and edges, no soft shadows, darker state colors. Switched from the accessibility settings by setting `data-theme="contrast"` on `<html>`. Every token already has its high-contrast value, so components need no extra code as long as they only use tokens.

## Typography

**DM Sans** (Google Fonts, open license), loaded with weights 400, 500, 600 and 700. It covers the Kaqchikel characters (ä, ë, ï, ö, ü and the saltillo ').

| Weight | Use |
|---|---|
| 400 Regular | Running text: `body`, `body-lg`, `small`. |
| 500 Medium | `caption` only. |
| 600 Semibold | Emphasis inside text, list item titles, counters, Santi's bubble. |
| 700 Bold | Headings, buttons, eyebrow labels, marker numbers. |

Rules:
- **Tight tracking:** every style has a slightly negative letter spacing (−0.1px to −1px, tighter as the size grows) for a compact, friendly look. Uppercase `label` keeps a small positive spacing (0.5px) so the capitals don't touch. Don't override tracking per component.
- Never use 300 or lighter: thin strokes disappear in sunlight.
- At most two weights in one component (usually 700 + 400).
- Running text at 16px minimum; `small` (14px) only for one- or two-line metadata; `caption` and `label` (12px) never for sentences.
- Reading width: 60–70 characters max per line; on phones the gutter does this for you.
- Text sizes are in px in tokens but should be written in `rem` in code (16px = 1rem) so the "larger text" setting can scale them.

The full type scale (display, title-1, title-2, heading, body-lg, body, body-strong, small, small-strong, button, bubble, label, caption, marker) is in the Typography view, with sizes, line heights and usage.

## Spacing and layout

- **4px grid.** Every margin, padding and gap is a `space-*` or `pad-*` token.
- **Screen gutter** `pad-screen-x` (16px) left and right on every screen.
- **Content width** max `content-max` (480px), centered on larger screens.
- **Rhythm:** `space-2` (8) inside a group, `space-3` (12) between cards, `space-6` (24) between sections, `space-8` (32) before a new major block.
- **Primary action** sits at the bottom of the screen, full width inside the gutter, with `space-8` above the bottom safe area.
- Component padding (buttons, cards, sheets, chips, bubble) uses the `pad-*` tokens; see Components.

## Shape

- **Very rounded.** Every button, chip and badge is a full pill (`radius-pill`). Cards use `radius-lg` (24px), sheets, the hero header and Santi's bubble `radius-xl` (36px), photo frames and banners `radius-md` (20px), inputs and thumbnails `radius-sm` (12px). Nothing in the UI has a sharp corner. Nested corners get a smaller radius than their container (container radius minus its padding).
- **Borders:** `border-hairline` (1px, `border`) on resting cards; `border-control` (2px) on selected and interactive outlines; focus is a `border-focus` (3px) ring in `focus` with a 2px offset, on every focusable element.

## Elevation

Two kinds, never mixed on one element:
- **3D edge** (playful): `shadow-button-*`, a solid 4px offset below buttons. On press, the button moves down 4px and the edge disappears.
- **Soft shadow** (calm): `shadow-card` for cards, `shadow-raised` for floating items (bubble, map controls, toasts), `shadow-sheet` for bottom sheets.

The high-contrast theme removes soft shadows and turns edges black.

## Touch and sizes

- Every tappable element has at least a `touch-min` (48px) hit area, even when it looks smaller (map markers are 36px discs with a 48px hit area).
- Buttons are `button-h-md` (52px) by default; `button-h-sm` (40px) only for secondary actions inside cards.
- Icons: `icon-md` (24px) by default, `icon-sm` (20px) in chips, `icon-lg` (32px) as card leading icons.
- Gestures always have a button alternative (zoom +/−, next/previous), per WCAG 2.2.

## Motion

GSAP for Santi and transitions; CSS for small state changes.

| Use | Duration | Easing |
|---|---|---|
| Press, hover, toggles | 120ms | ease-out |
| Cards, sheets, screen changes | 200–280ms | `cubic-bezier(.2,.8,.2,1)` |
| Zoom to a map point | 450ms | `power2.inOut` |
| Santi entrances and celebrations | 400–600ms | `back.out(1.6)` |

With `prefers-reduced-motion` (or the in-app setting): no bounce, no zoom animation (simple cut), Santi switches poses without movement, cross-fades of at most 150ms. Nothing flashes more than 3 times per second.

## Iconography

Rounded line icons, 2px stroke at 24px, round caps and joins, drawn in `ink` (or `ink-subtle` when inactive). A set such as Lucide matches this style. Filled icons only inside markers and the play button. Icons never replace a label on primary actions.

## Santi

Santi lives in the `Santi` asset group. He guides and celebrates; he never sits on top of the content he is explaining.
- Sizes: `santi-sm` (64px) next to bubbles, `santi-md` (120px) on cards and confirmation, `santi-lg` (200px) on welcome and celebration.
- His bubble: `yellow-50` fill, `ink` text in `bubble`, `radius-xl`, `shadow-raised`, a tail pointing to him.
- One Santi per screen. In respect mode he wears headphones and stays still.
- His colors are not UI colors: never use `green-400` or `red-400` for text, and do not tint buttons to match him.

## In code

Tokens become CSS custom properties with the same names (`var(--yellow-400)`, `var(--space-4)`, `var(--radius-lg)`, `var(--shadow-card)`), the light theme on `:root` and the high-contrast values under `[data-theme="contrast"]`. Components use semantic aliases first, raw steps only when no alias fits.
