# Popup design trial

Reload the unpacked extension from this repository to try the editorial popup.
The countdown uses Instrument Serif; controls use DM Sans and details use DM Mono.
All fonts are bundled locally with their licenses. Colours follow the browser theme.

Select **Classic design** at the bottom of the popup to return to the previous layout.
The choice is remembered. Select **Try the new design** in Classic to switch back.
Both layouts share the same saved sites and background refresh timers.

The original popup.html, popup.css, and popup.js remain unchanged. The classic folder
contains a copy with the design switch added. The published v4.3.1 release is also
available as a complete fallback. This design is included in version 4.4.0.

Verification: `node tests/popup-smoke.cjs` with Playwright available and Microsoft Edge installed.
The test uses a simulated Chrome API to check the popup interactions, not live tab refreshes.

## Open tab when page changes

Both designs have an off-by-default, per-page checkbox. While refreshing an open tab,
it compares normalized visible text shortly after each page load. The first successful
read establishes a baseline. Later changes activate that existing tab and focus its
window. The setting is saved with the page and used for automatic starts.

This does not monitor closed tabs, image-only changes, or changes that appear long after
the page loads. Ads and live clocks can trigger it. Page text stays in the page; only
a compact fingerprint is stored locally. Unreadable pages show a detection error while
the refresh timer continues. Reload the extension once to enable the added scripting
permission. Background detection checks: `node tests/change-detection.cjs`.
