# Typography review — local changes, 2026-10-09

Retained Instrument Serif headings, Josefin Sans countdown, DM Sans controls,
DM Mono details, and Arial in Classic. Secondary text now starts at 12px and
main controls at 14px with relative units. These sizes are design choices;
WCAG does not prescribe a universal minimum font size.

The shared typography.css must be included in future release ZIPs. It is loaded
after the active theme in editorial.html, classic/popup.html, and popup.html.

Darkened the red gradient and raised its lettering to silver #edf0f4. A conservative
lightest composite gradient sample (#b7323b) measures 5.20:1. Secondary text on
the lightest graphite surface measures 6.43:1. Classic white on red measures 5.19:1;
removed Classic's brightness filter to avoid reducing that ratio on hover.
Brightened Classic empty-history text. Decorative bevels are outside label interiors.

Checks: existing popup interactions and fallback preference; metallic theme with
200% root text size plus WCAG text-spacing overrides; fallback layouts at 200%
root text size; layout overflow and button/label clipping; visual screenshot review.
The timer is slightly smaller to leave room for enlarged numerals.

This is a focused typography review, not a full WCAG conformance certification.
Live browser popup zoom and assistive-technology testing remain manual checks.

References:
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html
- https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html
