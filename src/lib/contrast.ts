/**
 * WCAG 2.1 contrast helpers.
 *
 * Use these instead of a perceived-brightness threshold: brightness heuristics
 * only guess "light or dark", they do not guarantee the 4.5:1 ratio WCAG AA
 * requires for normal text.
 */

const DARK_TEXT = '#0f172a' // slate-900
const LIGHT_TEXT = '#ffffff'

/** WCAG relative luminance of a #rrggbb colour. */
export function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Contrast ratio between two colours (1–21). */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Picks whichever of dark/light text has the better contrast on `background`.
 * Always returns the more readable option, so a badge can never end up with
 * white-on-yellow style unreadable text.
 */
export function pickTextColor(background: string): string {
  return contrastRatio(background, DARK_TEXT) >= contrastRatio(background, LIGHT_TEXT)
    ? DARK_TEXT
    : LIGHT_TEXT
}

/** True when the pair meets WCAG AA for normal text. */
export function meetsAA(foreground: string, background: string): boolean {
  return contrastRatio(foreground, background) >= 4.5
}
