const defaultConfig = {
  focus: 25,
  short: 5,
  long: 15,
  interval: 4,
};

const modes = {
  focus: { label: "تمرکز فعال", type: "focus" },
  short: { label: "استراحت کوتاه", type: "break" },
  long: { label: "استراحت بلند", type: "break" },
};

const state = {
  config: { ...defaultConfig },
  activeMode: "focus",
  remainingSeconds: defaultConfig.focus * 60,
  timerId: null,
  running: false,
  cycle: 1,
};

const elements = {};

const select = (selector) => document.querySelector(selector);

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${secs}`;
};

const durationFor = (modeKey) => state.config[modeKey] * 60;

const setProgress = () => {
  const total = durationFor(state.activeMode);
  const completed = total - state.remainingSeconds;
  const deg = `${(completed / total) * 360}deg`;
  elements.timerFill.style.setProperty("--progress", deg);
};

const updateModeUI = () => {
  elements.modeTabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.mode === state.activeMode);
  });
  elements.modeLabel.textContent = modes[state.activeMode].label;
  elements.timeText.textContent = formatTime(state.remainingSeconds);
  elements.cycleLabel.textContent = `چرخه ${state.cycle} از ${state.config.interval}`;
  setProgress();
};

const resetTimer = () => {
  clearInterval(state.timerId);
  state.timerId = null;
  state.running = false;
  elements.startPause.textContent = "شروع";
};

const setMode = (modeKey, { skipReset = false } = {}) => {
  state.activeMode = modeKey;
  state.remainingSeconds = durationFor(modeKey);
  if (!skipReset) {
    resetTimer();
  }
  updateModeUI();
};

const tick = () => {
  if (state.remainingSeconds <= 0) {
    completePhase();
    return;
  }
  state.remainingSeconds -= 1;
  elements.timeText.textContent = formatTime(state.remainingSeconds);
  setProgress();
};

const startTimer = () => {
  if (state.running) return;
  state.running = true;
  elements.startPause.textContent = "توقف";
  state.timerId = setInterval(tick, 1000);
};

const pauseTimer = () => {
  if (!state.running) return;
  resetTimer();
};

const toggleTimer = () => {
  if (state.running) {
    pauseTimer();
  } else {
    startTimer();
  }
};

const advanceMode = () => {
  if (state.activeMode === "focus") {
    const nextIsLong = state.cycle % state.config.interval === 0;
    setMode(nextIsLong ? "long" : "short", { skipReset: true });
  } else {
    state.cycle += 1;
    setMode("focus", { skipReset: true });
  }
  updateModeUI();
};

const logStats = (modeKey) => {
  if (modeKey === "focus") {
    Storage.updateToday((stats) => ({
      ...stats,
      focusSessions: stats.focusSessions + 1,
      focusMinutes: stats.focusMinutes + state.config.focus,
    }));
  } else {
    Storage.updateToday((stats) => ({
      ...stats,
      breakMinutes: stats.breakMinutes + state.config[modeKey],
    }));
  }
};

const completePhase = () => {
  resetTimer();
  logStats(state.activeMode);
  renderStats();
  advanceMode();
};

const skipPhase = () => {
  completePhase();
};

const handleSettingsSubmit = (event) => {
  event.preventDefault();
  const formData = new FormData(event.target);
  state.config = {
    focus: clampValue(formData.get("focus"), 10, 60, defaultConfig.focus),
    short: clampValue(formData.get("short"), 3, 20, defaultConfig.short),
    long: clampValue(formData.get("long"), 10, 40, defaultConfig.long),
    interval: clampValue(formData.get("interval"), 2, 6, defaultConfig.interval),
  };
  state.cycle = 1;
  setMode("focus");
};

const clampValue = (value, min, max, fallback) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
};

const renderStats = () => {
  const today = Storage.getToday();
  elements.todayDate.textContent = Storage.todayKey();
  elements.todayFocus.textContent = today.focusSessions;
  elements.todayFocusMinutes.textContent = today.focusMinutes;
  elements.todayBreakMinutes.textContent = today.breakMinutes;

  const historyEntries = Storage.history();
  if (!historyEntries.length) {
    elements.historyList.innerHTML = '<li class="history__empty">هنوز آماری ثبت نشده است.</li>';
    return;
  }

  elements.historyList.innerHTML = historyEntries
    .map(
      (entry) => `
        <li>
          <strong>${entry.date}</strong>
          <span>${entry.focusSessions} چرخه تمرکز</span>
          <span>${entry.focusMinutes} دقیقه تمرکز</span>
          <span>${entry.breakMinutes} دقیقه استراحت</span>
        </li>
      `
    )
    .join(" ");
};

const bindEvents = () => {
  elements.modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      setMode(tab.dataset.mode);
    });
  });
  elements.startPause.addEventListener("click", toggleTimer);
  elements.reset.addEventListener("click", () => setMode(state.activeMode));
  elements.skip.addEventListener("click", skipPhase);
  elements.settingsForm.addEventListener("submit", handleSettingsSubmit);
  elements.resetStats.addEventListener("click", () => {
    Storage.clearAll();
    renderStats();
  });
};

const initElements = () => {
  elements.modeTabs = [...document.querySelectorAll(".mode-tab")];
  elements.modeLabel = select("#mode-label");
  elements.timeText = select("#time-text");
  elements.timerFill = select("#timer-fill");
  elements.startPause = select("#start-pause");
  elements.reset = select("#reset");
  elements.skip = select("#skip");
  elements.cycleLabel = select("#cycle-label");
  elements.settingsForm = select("#settings-form");
  elements.resetStats = select("#reset-stats");
  elements.todayDate = select("#today-date");
  elements.todayFocus = select("#today-focus");
  elements.todayFocusMinutes = select("#today-focus-minutes");
  elements.todayBreakMinutes = select("#today-break-minutes");
  elements.historyList = select("#history-list");
};

const hydrateForm = () => {
  elements.settingsForm.focus.value = state.config.focus;
  elements.settingsForm.short.value = state.config.short;
  elements.settingsForm.long.value = state.config.long;
  elements.settingsForm.interval.value = state.config.interval;
};

const boot = () => {
  initElements();
  hydrateForm();
  bindEvents();
  renderStats();
  setMode("focus", { skipReset: true });
};

window.addEventListener("DOMContentLoaded", boot);

