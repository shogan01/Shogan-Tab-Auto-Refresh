# Shogan Auto Refresh

A lightweight Chrome extension that automatically refreshes selected web pages at custom intervals.

Shogan Auto Refresh was built to stay simple: choose a page, choose a timer, start it, and let it run.

## Features

- Refresh pages at preset intervals from **5 seconds to 10 minutes**
- Set a **custom refresh interval**
- Choose a specific page URL to monitor
- Continue refreshing while the tab is in the background
- Live countdown on the extension toolbar badge
- **Recent Sites** history
- Remembers the last refresh interval used for saved sites
- Optional **Auto-start** when a saved page is opened
- Start or stop refreshing at any time
- Stores settings and history locally in Chrome
- Custom Shogan red/black interface and toolbar icon
- No account, subscription, or external service required

## Current Version

**4.3.0**

## Installation

1. Go to the latest GitHub release.
2. Download **`Shogan-Auto-Refresh-v4.3.0.zip`** from the release assets.
3. Extract the ZIP to a permanent folder.
4. Open Chrome and go to `chrome://extensions`.
5. Enable **Developer mode**.
6. Click **Load unpacked**.
7. Select the extracted folder that contains `manifest.json`.
8. Pin **Shogan Auto Refresh** to the Chrome toolbar if desired.

> Do not delete or move the extracted extension folder after loading it into Chrome.

## How to Use

1. Open the page you want to refresh.
2. Click the **Shogan Auto Refresh** toolbar icon.
3. Confirm or enter the page URL.
4. Choose a refresh interval.
5. Click **Start**.

The extension will keep refreshing the selected page until you stop it or navigate away from that saved target.

### Recent Sites and Auto-start

When you start refreshing a page, Shogan Auto Refresh remembers the page and its last timer.

Saved pages appear under **Recent Sites**. Auto-start can be enabled or disabled for each saved page.

When Auto-start is enabled, opening that exact saved page will automatically restart its remembered refresh timer.

## Important Notes

- Shogan Auto Refresh is currently installed as an **unpacked Chrome extension**.
- The **5-second option** is intended for unpacked / Developer Mode installs.
- Chrome may delay refreshes while the computer is sleeping. Refreshing resumes after the computer wakes.
- Site history and settings are stored locally in Chrome.

## Updating

When a new version is released:

1. Download the new release ZIP.
2. Extract it to a new folder.
3. Open `chrome://extensions`.
4. Remove the old unpacked version or point Chrome to the new extracted folder.
5. Load the updated extension.

## Privacy

Shogan Auto Refresh does not require an account or external service. Its saved site history and settings are stored locally by Chrome.

## Releases

Stable versions are published through the repository's **Releases** section.

## Project Goal

Keep automatic page refreshing straightforward, useful, and free without unnecessary complexity or subscription features.
