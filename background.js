const STATE_PREFIX = "tab_";
const REFRESH_PREFIX = "refresh_";
const BADGE_PREFIX = "badge_";
const HISTORY_KEY = "siteHistory";
const MAX_HISTORY = 12;

function stateKey(tabId) { return `${STATE_PREFIX}${tabId}`; }
function refreshAlarm(tabId) { return `${REFRESH_PREFIX}${tabId}`; }
function badgeAlarm(tabId) { return `${BADGE_PREFIX}${tabId}`; }

async function getState(tabId) {
  const data = await chrome.storage.local.get(stateKey(tabId));
  return data[stateKey(tabId)] || null;
}

async function saveState(tabId, state) {
  await chrome.storage.local.set({ [stateKey(tabId)]: state });
}

async function removeState(tabId) {
  await chrome.storage.local.remove(stateKey(tabId));
}

async function getHistory() {
  const data = await chrome.storage.local.get(HISTORY_KEY);
  return Array.isArray(data[HISTORY_KEY]) ? data[HISTORY_KEY] : [];
}

async function saveHistory(history) {
  await chrome.storage.local.set({ [HISTORY_KEY]: history.slice(0, MAX_HISTORY) });
}

function normalized(url) {
  try {
    const u = new URL(url);
    u.hash = "";
    return u.toString();
  } catch {
    return url;
  }
}

function sameTarget(a, b) {
  return normalized(a) === normalized(b);
}

async function rememberSite(targetUrl, intervalSeconds, autoStart = true) {
  const url = normalized(targetUrl);
  const history = await getHistory();
  const filtered = history.filter(item => !sameTarget(item.url, url));

  filtered.unshift({
    url,
    intervalSeconds,
    autoStart,
    lastUsedAt: Date.now()
  });

  await saveHistory(filtered);
}

async function removeHistorySite(targetUrl) {
  const history = await getHistory();
  await saveHistory(history.filter(item => !sameTarget(item.url, targetUrl)));
}

async function findHistorySite(url) {
  const history = await getHistory();
  return history.find(item => sameTarget(item.url, url)) || null;
}

async function clearTabAlarms(tabId) {
  await chrome.alarms.clear(refreshAlarm(tabId));
  await chrome.alarms.clear(badgeAlarm(tabId));
}

async function clearBadge(tabId) {
  try {
    await chrome.action.setBadgeText({ tabId, text: "" });
    await chrome.action.setTitle({ tabId, title: "Shogan Auto Refresh" });
  } catch {}
}

async function updateBadge(tabId) {
  const state = await getState(tabId);
  if (!state?.enabled || !state.nextRefreshAt) {
    await clearBadge(tabId);
    return;
  }

  const remaining = Math.max(0, Math.ceil((state.nextRefreshAt - Date.now()) / 1000));
  let text;

  if (remaining < 100) {
    text = String(remaining);
  } else {
    const mins = Math.ceil(remaining / 60);
    text = mins < 100 ? `${mins}m` : "99+";
  }

  try {
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#D71920" });
    await chrome.action.setBadgeTextColor({ tabId, color: "#FFFFFF" });
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setTitle({
      tabId,
      title: `Shogan Auto Refresh — ${remaining}s until refresh`
    });
  } catch {}
}

async function scheduleForTab(tabId, state) {
  await clearTabAlarms(tabId);

  const when = Date.now() + state.intervalSeconds * 1000;
  state.nextRefreshAt = when;
  await saveState(tabId, state);

  await chrome.alarms.create(refreshAlarm(tabId), { when });

  await chrome.alarms.create(badgeAlarm(tabId), {
    delayInMinutes: 1 / 60,
    periodInMinutes: 1 / 60
  });

  await updateBadge(tabId);
}

async function stopTab(tabId) {
  await clearTabAlarms(tabId);
  await clearBadge(tabId);
  await removeState(tabId);
}

async function startSavedSiteIfMatched(tabId, tabUrl) {
  if (!tabUrl?.startsWith("http://") && !tabUrl?.startsWith("https://")) return false;

  const existing = await getState(tabId);

  if (existing?.enabled && sameTarget(existing.targetUrl, tabUrl)) return true;

  const saved = await findHistorySite(tabUrl);
  if (!saved?.autoStart) return false;

  const state = {
    enabled: true,
    intervalSeconds: saved.intervalSeconds,
    targetUrl: normalized(saved.url),
    nextRefreshAt: null,
    autoStarted: true
  };

  await saveState(tabId, state);
  await scheduleForTab(tabId, state);
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    if (message.type === "START") {
      const { tabId, intervalSeconds, targetUrl } = message;

      const state = {
        enabled: true,
        intervalSeconds,
        targetUrl: normalized(targetUrl),
        nextRefreshAt: null,
        autoStarted: false
      };

      await rememberSite(state.targetUrl, intervalSeconds, true);
      await saveState(tabId, state);

      const tab = await chrome.tabs.get(tabId);

      if (!sameTarget(tab.url || "", state.targetUrl)) {
        await chrome.tabs.update(tabId, { url: state.targetUrl });
        sendResponse({ ok: true, navigating: true });
        return;
      }

      await scheduleForTab(tabId, state);
      sendResponse({ ok: true, navigating: false });
      return;
    }

    if (message.type === "STOP") {
      await stopTab(message.tabId);
      sendResponse({ ok: true });
      return;
    }

    if (message.type === "GET_STATE") {
      sendResponse({ ok: true, state: await getState(message.tabId) });
      return;
    }

    if (message.type === "GET_HISTORY") {
      sendResponse({ ok: true, history: await getHistory() });
      return;
    }

    if (message.type === "REMOVE_HISTORY") {
      await removeHistorySite(message.targetUrl);
      sendResponse({ ok: true, history: await getHistory() });
      return;
    }

    if (message.type === "CLEAR_HISTORY") {
      await saveHistory([]);
      sendResponse({ ok: true, history: [] });
      return;
    }

    if (message.type === "SET_HISTORY_AUTOSTART") {
      const history = await getHistory();
      const item = history.find(x => sameTarget(x.url, message.targetUrl));
      if (item) item.autoStart = Boolean(message.autoStart);
      await saveHistory(history);
      sendResponse({ ok: true, history });
      return;
    }
  })();

  return true;
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith(REFRESH_PREFIX)) {
    const tabId = Number(alarm.name.slice(REFRESH_PREFIX.length));
    const state = await getState(tabId);
    if (!state?.enabled) return;

    try {
      const tab = await chrome.tabs.get(tabId);

      if (!sameTarget(tab.url || "", state.targetUrl)) {
        await clearTabAlarms(tabId);
        state.nextRefreshAt = null;
        await saveState(tabId, state);

        await chrome.action.setBadgeText({ tabId, text: "!" });
        await chrome.action.setBadgeBackgroundColor({ tabId, color: "#555555" });
        await chrome.action.setTitle({
          tabId,
          title: "Shogan Auto Refresh — tab is not on the selected page"
        });
        return;
      }

      await chrome.action.setBadgeText({ tabId, text: "↻" });
      await chrome.tabs.reload(tabId);
    } catch {
      await stopTab(tabId);
    }
    return;
  }

  if (alarm.name.startsWith(BADGE_PREFIX)) {
    const tabId = Number(alarm.name.slice(BADGE_PREFIX.length));
    await updateBadge(tabId);
  }
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;

  const state = await getState(tabId);

  if (state?.enabled && tab.url && sameTarget(tab.url, state.targetUrl)) {
    await scheduleForTab(tabId, state);
    return;
  }

  if (state?.enabled && tab.url && !sameTarget(tab.url, state.targetUrl)) {
    await clearTabAlarms(tabId);
    await clearBadge(tabId);
    await removeState(tabId);
  }

  await startSavedSiteIfMatched(tabId, tab.url);
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  await stopTab(tabId);
});

async function restore() {
  const all = await chrome.storage.local.get(null);

  for (const [key, state] of Object.entries(all)) {
    if (!key.startsWith(STATE_PREFIX) || !state?.enabled) continue;

    const tabId = Number(key.slice(STATE_PREFIX.length));

    try {
      const tab = await chrome.tabs.get(tabId);
      if (sameTarget(tab.url || "", state.targetUrl)) {
        await scheduleForTab(tabId, state);
      } else {
        await stopTab(tabId);
        await startSavedSiteIfMatched(tabId, tab.url);
      }
    } catch {
      await stopTab(tabId);
    }
  }
}

chrome.runtime.onStartup.addListener(restore);
chrome.runtime.onInstalled.addListener(restore);
restore();