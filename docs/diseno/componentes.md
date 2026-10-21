# Components

Specs for the base components of Sprint 2 and the pieces the next sprints reuse. Every value is a token; if a value is not here, use the closest token rather than a new number.

## Button

| Variant | Fill | Text | Edge | Use |
|---|---|---|---|---|
| Primary | `brand` (yellow-400) | `ink` | `shadow-button-primary` | The one main action per screen ("Continuar", "Sí, ver detalle"). |
| Accent | `accent` (sky-400) | `ink` | `shadow-button-accent` | "Ver cómo era" and other secondary highlights. Max one per screen. |
| Secondary | `surface` + 2px `border-strong` | `ink` | `shadow-button-secondary` | "Saltar", "Anterior", "Siguiente". |
| Ghost | none | `ink` (or `error` if destructive) | none | Tertiary actions ("Volver al mapa" as text link). Underline on focus. |

- Size md: height `button-h-md`, padding `pad-button-y` `pad-button-x`, text style `button`, radius `radius-pill`. Full width at the bottom of a screen.
- Size sm: height `button-h-sm`, padding `pad-button-sm-y` `pad-button-sm-x`, still a 48px hit area.
- Icon + label gap `space-2`; icons `icon-md` (md) or `icon-sm` (sm).
- States: **pressed** = translateY(4px), edge removed, primary fill `yellow-500`; **focus** = 3px `focus` ring, 2px offset; **disabled** = fill `surface-sunken`, text `ink-subtle`, no edge, not focusable; **loading** = label kept, spinner replaces the icon.

## Card

- Fill `surface`, 1px `border`, `shadow-card`, radius `radius-lg`, padding `pad-card`, gap between cards `space-3`.
- Content: optional leading icon (`icon-lg`) or thumbnail (`radius-sm`), title in `heading` or `body-strong`, subtitle in `small` `ink-muted`, optional trailing chevron or badge.
- Tappable cards: the whole card is the target; pressed = `surface-sunken` fill (`brand-tint` in high contrast, where `surface-sunken` is white).
- **Selected** (route, zone): 2px `border-strong` border (`ink` in high contrast) and a check icon; the fill stays `surface` (no tint). Selection never relies on color alone.
- **Unavailable** ("Próximamente"): content at `opacity-unavailable`, a "Próximamente" badge at full opacity, not focusable as an action.

## Badge / chip

- Height 24px, padding `pad-chip-y` `pad-chip-x`, radius `radius-pill`, text `small-strong`.
- Neutral: `surface-sunken` + `ink`. Brand: `yellow-50` + `yellow-800`. Warning: `orange-50` + `orange-700`. Info: `sky-50` + `sky-700`. Success: `green-50` + `green-700`. Error: `red-50` + `red-800`.
- Used for times ("50 min"), counts ("3 / 12") and "Próximamente".

## Top bar and back chevron

- Height `header-h`, gutter `pad-screen-x`, white background, 1px `border` bottom only when content scrolls under it.
- Back: chevron-left `icon-md` in `ink` plus a short label in `body-strong` ("Mapa", "Zonas"), 48px hit area. Never a lone arrow without a label for screen readers (`aria-label` minimum).

## Hero header

- Used on welcome and the ficha. Fill `ink` with `surface` text, or `yellow-400` with `ink` text; bottom corners `radius-xl`; padding `space-10` top, `space-6` bottom, gutter sides.
- Eyebrow `label` above the title: `surface` on an ink header, `ink` on a yellow header. Never yellow text on ink.

## Progress bar

- Height `progress-h`, radius `radius-pill`, track `yellow-100`, fill `brand`; in high contrast the track gets a 1px `ink` border.
- Always paired with a text counter ("3 / 12 detalles") in `small-strong`, and `role="progressbar"` with `aria-valuenow`.
- Fill animates 280ms on change; no animation with reduced motion.

## Map point marker

| State | Look | Number |
|---|---|---|
| Essential | Solid `point-essential` (red-600) disc | `surface`, style `marker` |
| Optional | `point-optional` (yellow-400) disc with a 2px dashed `ink` ring | `ink` |
| Completed | `point-completed` (green-700) disc | white check icon |
| Next in route | Current state + 4px `yellow-200` halo, gentle pulse (none with reduced motion) | unchanged |
| Unavailable | `opacity-unavailable` | unchanged; tooltip text explains |

- Disc `marker` (36px), hit area `touch-min`, white 2px outline so it reads over the illustration, `shadow-raised`.
- Each marker is a button labelled "Punto 7, Nicho central, esencial, no visitado" (state in words).

## Santi bubble

- Fill `brand-tint`, text `bubble` in `ink`, padding `pad-bubble`, radius `radius-xl`, `shadow-raised`, max width 260px, tail toward Santi.
- One or two short sentences. Enters with a 200ms scale-in after Santi; text is also announced to screen readers (`aria-live="polite"`).

## Audio bar (ficha narration)

- Fill `surface-sunken`, radius `radius-md`, padding `space-3`.
- Play button: 48px `accent` disc with an `ink` play icon. Progress line: track `border`, fill `sky-700`. Time in `small` `ink-muted`.
- "Transcripción" as a secondary sm button. Audio never autoplays.

## Bottom sheet and dialog

- Fill `surface`, top corners `radius-xl`, padding `pad-sheet`, `shadow-sheet`, scrim `ink` at `opacity-scrim`.
- A grab handle (36 × 4px, `border-strong`, pill) and a close button with a label. One primary action at the bottom.

## Banners

- Info `sky-50` / `sky-700` text, warning `orange-50` / `orange-700`, error `red-50` / `red-800`, success `green-50` / `green-700`.
- Radius `radius-md`, padding `space-3` `space-4`, leading icon `icon-md` in the text color, text `small` or `body`.
