const targetUrlEl = document.getElementById("targetUrl");
const intervalEl = document.getElementById("interval");
const customRow = document.getElementById("customRow");
const customValue = document.getElementById("customValue");
const customUnit = document.getElementById("customUnit");
const statusEl = document.getElementById("status");
const countdownEl = document.getElementById("countdown");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const autoStartEl = document.getElementById("autoStart");
const openOnChangeEl = document.getElementById("openOnChange");
let historyItems = [];
function updatePage() {
  const name = document.getElementById("pageName");
  try { const url = new URL(targetUrlEl.value); name.textContent = url.host + (url.pathname === "/" ? "" : url.pathname); }
  catch { name.textContent = "Choose a page"; }
  name.title = targetUrlEl.value;
  const normalize = value => { try { const u = new URL(value); u.hash = ""; return u.href; } catch { return value; } };
  const saved = historyItems.find(item => normalize(item.url) === normalize(targetUrlEl.value));
  autoStartEl.checked = saved?.autoStart !== false;
  openOnChangeEl.checked = saved?.openOnChange === true || (state?.targetUrl === targetUrlEl.value && state?.openOnChange === true);
}

let currentTabId = null;
let state = null;
let ticker = null;

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function showCustomIfNeeded() {
  customRow.classList.toggle("hidden", intervalEl.value !== "custom");
  document.querySelectorAll("[data-interval]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.interval === intervalEl.value)));
  document.getElementById("intervalLabel").textContent = formatInterval(getSelectedSeconds());
  updateDisplay();
}

function setIntervalUI(seconds) {
  const presets = ["5", "30", "60", "120", "300", "600"];
  const value = String(seconds);

  if (presets.includes(value)) {
    intervalEl.value = value;
  } else {
    intervalEl.value = "custom";
    customValue.value = seconds;
    customUnit.value = "1";
  }

  showCustomIfNeeded();
}

function getSelectedSeconds() {
  if (intervalEl.value !== "custom") {
    return Number(intervalEl.value);
  }

  const value = Math.max(1, Number(customValue.value || 1));
  const unit = Number(customUnit.value);
  return Math.max(5, value * unit);
}

function formatRemaining(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatInterval(seconds) {
  if (seconds % 60 === 0) {
    const mins = seconds / 60;
    return `${mins} min`;
  }
  return `${seconds} sec`;
}

function updateDisplay() {
  document.getElementById("changeCheckError").textContent = state?.changeCheckError || "";
  startBtn.classList.toggle("hidden", Boolean(state?.enabled));
  stopBtn.classList.toggle("hidden", !state?.enabled);
  document.getElementById("timerCaption").textContent = state?.enabled ? `Refreshing every ${formatInterval(state.intervalSeconds)}` : "between refreshes";
  if (!state?.enabled) {
    statusEl.textContent = "Ready when you are";
    countdownEl.textContent = formatRemaining(getSelectedSeconds() * 1000);
    return;
  }

  statusEl.textContent = state.autoStarted ? "Auto-started · next refresh in" : "Next refresh in";

  if (!state.nextRefreshAt) {
    countdownEl.textContent = "—";
    statusEl.textContent = "Waiting for the selected page";
  } else {
    countdownEl.textContent = formatRemaining(state.nextRefreshAt - Date.now());
  }
}

async function refreshState() {
  if (!currentTabId) return;

  const response = await chrome.runtime.sendMessage({
    type: "GET_STATE",
    tabId: currentTabId
  });

  state = response.state;
  updateDisplay();
}

async function renderHistory() {
  const response = await chrome.runtime.sendMessage({ type: "GET_HISTORY" });
  const history = response.history || [];
  historyItems = history;
  document.getElementById("historyCount").textContent = history.length;

  historyList.innerHTML = "";

  if (!history.length) {
    historyList.innerHTML = '<div class="history-empty">No saved sites yet.</div>';
    return;
  }

  for (const item of history) {
    const wrap = document.createElement("div");
    wrap.className = "history-item";

    const top = document.createElement("div");
    top.className = "history-top";

    const main = document.createElement("div");
    main.className = "history-main";

    const url = document.createElement("div");
    url.className = "history-url";
    url.textContent = item.url;
    url.title = item.url;

    const meta = document.createElement("div");
    meta.className = "history-meta";
    meta.textContent = `Last timer: ${formatInterval(item.intervalSeconds)}`;

    main.appendChild(url);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "history-actions";

    const useBtn = document.createElement("button");
    useBtn.className = "small-button";
    useBtn.textContent = "Use";
    useBtn.addEventListener("click", () => {
      targetUrlEl.value = item.url;
      setIntervalUI(item.intervalSeconds);
      updatePage();
      messageEl.textContent = "Loaded saved site settings.";
    });

    const removeBtn = document.createElement("button");
    removeBtn.className = "small-button remove";
    removeBtn.textContent = "×";
    removeBtn.title = "Remove from history";
    removeBtn.setAttribute("aria-label", `Remove ${item.url} from history`);
    removeBtn.addEventListener("click", async () => {
      await chrome.runtime.sendMessage({
        type: "REMOVE_HISTORY",
        targetUrl: item.url
      });
      await renderHistory();
    });

    actions.appendChild(useBtn);
    actions.appendChild(removeBtn);

    top.appendChild(main);
    top.appendChild(actions);

    const autoRow = document.createElement("label");
    autoRow.className = "autostart-row";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = item.autoStart !== false;
    checkbox.addEventListener("change", async () => {
      await chrome.runtime.sendMessage({
        type: "SET_HISTORY_AUTOSTART",
        targetUrl: item.url,
        autoStart: checkbox.checked
      });
      item.autoStart = checkbox.checked;
      updatePage();
    });

    const autoText = document.createElement("span");
    autoText.textContent = "Auto-start when this page is opened";

    autoRow.appendChild(checkbox);
    autoRow.appendChild(autoText);

    wrap.appendChild(top);
    wrap.appendChild(autoRow);
    historyList.appendChild(wrap);
  }
}

async function loadState() {
  const tab = await getCurrentTab();
  currentTabId = tab.id;

  const response = await chrome.runtime.sendMessage({
    type: "GET_STATE",
    tabId: currentTabId
  });

  state = response.state;

  if (state?.targetUrl) {
    targetUrlEl.value = state.targetUrl;
    setIntervalUI(state.intervalSeconds);
  } else if (tab.url?.startsWith("http://") || tab.url?.startsWith("https://")) {
    targetUrlEl.value = tab.url;
  }

  showCustomIfNeeded();
  updateDisplay();
  await renderHistory();
  updatePage();

  if (ticker) clearInterval(ticker);
  ticker = setInterval(refreshState, 500);
}

intervalEl.addEventListener("change", showCustomIfNeeded);
document.querySelectorAll("[data-interval]").forEach(button => button.addEventListener("click", () => {
  intervalEl.value = button.dataset.interval;
  showCustomIfNeeded();
  if (state?.enabled) messageEl.textContent = "Stop and start again to apply the new interval.";
}));
customValue.addEventListener("input", showCustomIfNeeded);
customUnit.addEventListener("change", showCustomIfNeeded);
document.getElementById("editPage").addEventListener("click", () => {
  const editor = document.getElementById("pageEditor");
  editor.classList.toggle("hidden");
  document.getElementById("editPage").setAttribute("aria-expanded", String(!editor.classList.contains("hidden")));
  if (!editor.classList.contains("hidden")) targetUrlEl.focus();
});
document.getElementById("usePage").addEventListener("click", () => {
  updatePage();
  document.getElementById("pageEditor").classList.add("hidden");
  document.getElementById("editPage").setAttribute("aria-expanded", "false");
  if (state?.enabled) messageEl.textContent = "Stop and start again to refresh the selected page.";
});
autoStartEl.addEventListener("change", async () => {
  await chrome.runtime.sendMessage({type:"SET_HISTORY_AUTOSTART",targetUrl:targetUrlEl.value,autoStart:autoStartEl.checked});
  await renderHistory();
});
openOnChangeEl.addEventListener("change", async () => {
  await chrome.runtime.sendMessage({type:"SET_OPEN_ON_CHANGE",tabId:currentTabId,targetUrl:targetUrlEl.value,openOnChange:openOnChangeEl.checked});
  await refreshState();
  await renderHistory();
});

startBtn.addEventListener("click", async () => {
  messageEl.textContent = "";

  let targetUrl = targetUrlEl.value.trim();
  if (!targetUrl) {
    messageEl.textContent = "Choose a page first.";
    document.getElementById("pageEditor").classList.remove("hidden");
    document.getElementById("editPage").setAttribute("aria-expanded", "true");
    targetUrlEl.focus();
    return;
  }

  if (!/^https?:\/\//i.test(targetUrl)) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    targetUrl = new URL(targetUrl).toString();
  } catch {
    messageEl.textContent = "Please enter a valid page URL.";
    return;
  }

  const intervalSeconds = getSelectedSeconds();
  if (!Number.isFinite(intervalSeconds) || !Number.isInteger(intervalSeconds) || intervalSeconds > 86400) {
    messageEl.textContent = "Enter a whole-number interval between 5 seconds and 24 hours.";
    return;
  }

  const response = await chrome.runtime.sendMessage({
    type: "START",
    tabId: currentTabId,
    intervalSeconds,
    targetUrl,
    autoStart: autoStartEl.checked,
    openOnChange: openOnChangeEl.checked
  });

  messageEl.textContent = response?.navigating
    ? "Opening the selected page and starting its timer."
    : "Auto refresh started and saved.";

  await refreshState();
  await renderHistory();
  targetUrlEl.value = targetUrl;
  updatePage();
});

stopBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({
    type: "STOP",
    tabId: currentTabId
  });

  state = null;
  messageEl.textContent = "Stopped for this tab. Saved site history remains.";
  updateDisplay();
});

clearHistoryBtn.addEventListener("click", async () => {
  await chrome.runtime.sendMessage({ type: "CLEAR_HISTORY" });
  await renderHistory();
  messageEl.textContent = "Saved site history cleared.";
});

loadState().catch(() => { messageEl.textContent = "Could not load this tab. Close and reopen the popup to try again."; });
