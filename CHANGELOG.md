# Changelog

## 4.4.7 — 2026-11-09

### Fixed
- Keep the toolbar countdown numeric during refresh instead of briefly replacing it with a refresh symbol.
- Reapply the badge when page loading starts; resume the countdown when loading completes.

### Maintenance
- Remove superseded theme declarations while preserving the current appearance.
- Remove a redundant timer redraw and an obsolete stylesheet version marker.
- Use an isolated Chromium browser for automated popup tests instead of requiring Edge.
- Add regression coverage for the badge during reload, countdown restart, and stopping.

### Updating and fallback
- No new settings or permissions. Existing timers, saved pages, and fallback designs are retained.
- Reload an updated unpacked installation. For a downloaded installation, extract the new ZIP and load its folder through the browser's extensions page.
- Release 4.4.6 remains available as a fallback.

Earlier release notes are available on the repository's GitHub Releases page.
