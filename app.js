const API_BASE = window.API_URL || `http://${window.location.hostname}:4000`;

const DEBUG_LOGS = true;

const showToast = (message, variant = "error") => {
  const toast = document.getElementById("toast");
  if (!toast || !message) return;
  toast.textContent = message;
  toast.classList.remove("hidden");
  toast.classList.toggle("is-error", variant === "error");
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 4000);
};
const DEBUG_WEEKLY = true;
const DEBUG_CONSISTENCY = false;

const RANK_TIERS = [
  {
    name: "Ember",
    min: 1,
    max: 3,
    tagline: "A spark in the dark.",
    color: "#ff7b72",
  },
  {
    name: "Initiate",
    min: 4,
    max: 7,
    tagline: "One who has entered the forge.",
    color: "#ffa657",
  },
  {
    name: "Adept",
    min: 8,
    max: 12,
    tagline: "Learning control over effort.",
    color: "#f2cc60",
  },
  {
    name: "Pathforger",
    min: 13,
    max: 20,
    tagline: "Turning actions into a path.",
    color: "#7ee787",
  },
  {
    name: "Warden",
    min: 21,
    max: 27,
    tagline: "Guardian of discipline.",
    color: "#58a6ff",
  },
  {
    name: "Ascendant",
    min: 28,
    max: 34,
    tagline: "Rising above impulse.",
    color: "#a5d6ff",
  },
  {
    name: "Architect",
    min: 35,
    max: 42,
    tagline: "Designing life with intention.",
    color: "#d2a8ff",
  },
  {
    name: "Paragon",
    min: 43,
    max: 50,
    tagline: "A living standard of consistency.",
    color: "#ff9a00",
  },
  {
    name: "Mythforged",
    min: 51,
    max: 57,
    tagline: "Shaped by countless days.",
    color: "#f85149",
  },
  {
    name: "Luminary",
    min: 58,
    max: 64,
    tagline: "A source of clarity and focus.",
    color: "#79c0ff",
  },
  {
    name: "Exemplar",
    min: 65,
    max: 72,
    tagline: "Others could follow this path.",
    color: "#c9d1d9",
  },
  {
    name: "Chronosmith",
    min: 73,
    max: 80,
    tagline: "Master of time and rhythm.",
    color: "#d29922",
  },
  {
    name: "Mythkeeper",
    min: 81,
    max: 87,
    tagline: "Keeper of one's own legend.",
    color: "#8b949e",
  },
  {
    name: "Eternal Architect",
    min: 88,
    max: 94,
    tagline: "Life as a crafted system.",
    color: "#c4b5fd",
  },
  {
    name: "Ascended",
    min: 95,
    max: 100,
    tagline: "No longer forging. Being.",
    color: "#ffd60a",
  },
];

const DEFAULT_STATS = {
  wisdom: 10,
  vitality: 10,
  resolve: 10,
  flow: 10,
  prosperity: 10,
  inspiration: 10,
};

const REWARDS = {
  FORGE: {
    1: { xp: 10, coins: 1 },
    2: { xp: 20, coins: 2 },
    3: { xp: 30, coins: 3 },
  },
  PURGE: {
    1: { xp: 8, coins: 1 },
    2: { xp: 16, coins: 2 },
    3: { xp: 24, coins: 3 },
  },
};

const TODO_REWARDS = {
  LOW: { xp: 5, coins: 0 },
  MEDIUM: { xp: 10, coins: 1 },
  HIGH: { xp: 20, coins: 2 },
};

const SUCCESS_STATUS = {
  FORGE: "FORGED",
  PURGE: "RESISTED",
};
const FAILURE_STATUS = {
  FORGE: "MISSED",
  PURGE: "SLIPPED",
};
const DASHBOARD_RANGE_KEY = "lifeforge_dashboard_range";
const DASHBOARD_FORGE_KEY = "lifeforge_dashboard_forge";
const DASHBOARD_PURGE_KEY = "lifeforge_dashboard_purge";

const getRankTierForLevel = (level) => {
  const normalized = Math.max(1, level);
  return (
    RANK_TIERS.find(
      (tier) => normalized >= tier.min && normalized <= tier.max
    ) || RANK_TIERS[RANK_TIERS.length - 1]
  );
};

const pad2 = (value) => String(value).padStart(2, "0");
const getTodoReward = (priority) =>
  TODO_REWARDS[priority] || TODO_REWARDS.MEDIUM;
const getUtcDateKey = (date) =>
  `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(
    date.getUTCDate()
  )}`;
const getLocalDateKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
const parseDateKey = (key) => {
  if (!key) return null;
  const [y, m, d] = key.split("-").map((val) => Number.parseInt(val, 10));
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
};
const parseLocalDateKey = (key) => {
  if (!key) return null;
  const [y, m, d] = key.split("-").map((val) => Number.parseInt(val, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};
const getRangeFromDays = (days) => {
  const now = new Date();
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - Math.max(0, days - 1));
  return { from: getUtcDateKey(start), to: getUtcDateKey(end) };
};
const getLocalRangeFromDays = (days) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(0, days - 1));
  return { from: getLocalDateKey(start), to: getLocalDateKey(end) };
};
const buildDateRangeKeys = (from, to) => {
  const start = parseDateKey(from);
  const end = parseDateKey(to);
  if (!start || !end) return [];
  const keys = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(getUtcDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
};
const buildLocalDateRangeKeys = (from, to) => {
  const start = parseLocalDateKey(from);
  const end = parseLocalDateKey(to);
  if (!start || !end) return [];
  const keys = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    keys.push(getLocalDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return keys;
};
const addLocalDays = (dateKey, delta) => {
  const date = parseLocalDateKey(dateKey);
  if (!date) return dateKey;
  date.setDate(date.getDate() + delta);
  return getLocalDateKey(date);
};
const normalizeLogDateKey = (dateKey) => {
  const parsed = parseLocalDateKey(dateKey);
  return parsed ? getLocalDateKey(parsed) : dateKey;
};
const getMomentumLabel = (percent) => {
  if (percent < 20) return "Getting started";
  if (percent < 50) return "Building momentum";
  if (percent < 80) return "Stable";
  return "Locked in";
};
const makeChartGradient = (chart, color) => {
  const { ctx, chartArea } = chart;
  if (!chartArea) return hexToRgba(color, 0.2);
  const gradient = ctx.createLinearGradient(
    0,
    chartArea.top,
    0,
    chartArea.bottom
  );
  gradient.addColorStop(0, hexToRgba(color, 0.45));
  gradient.addColorStop(1, hexToRgba(color, 0.05));
  return gradient;
};
const hexToRgba = (hex, alpha) => {
  if (!hex || typeof hex !== "string") return hex;
  const normalized = hex.startsWith("#") ? hex.slice(1) : hex;
  if (![3, 6].includes(normalized.length)) return hex;
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized;
  const intVal = Number.parseInt(expanded, 16);
  if (Number.isNaN(intVal)) return hex;
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
const rollingAverage = (values, windowSize) => {
  const output = [];
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    sum += values[i];
    if (i >= windowSize) {
      sum -= values[i - windowSize];
    }
    const windowCount = Math.min(windowSize, i + 1);
    output.push(windowCount ? sum / windowCount : 0);
  }
  return output;
};

class ApiClient {
  async request(path, options = {}) {
    const token = localStorage.getItem("lf_token");
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        credentials: "include", // cookie
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(options.headers || {}),
        },
        ...options,
      });

      if (res.status === 204) return null;
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = data.error || "Request failed";
        showToast(message, "error");
        throw new Error(message);
      }
      return data;
    } catch (err) {
      const message = err?.message || "Network error";
      showToast(message, "error");
      throw err;
    }

  }
  me() {
    return this.request("/api/me");
  }
  register(payload) {
    return this.request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  login(payload) {
    return this.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  logout() {
    return this.request("/api/auth/logout", { method: "POST" });
  }
  getProgress() {
    return this.request("/api/progress");
  }
  getHabits() {
    return this.request("/api/habits");
  }
  createHabit(payload) {
    return this.request("/api/habits", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  updateHabit(id, payload) {
    return this.request(`/api/habits/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
  deleteHabit(id) {
    return this.request(`/api/habits/${id}`, { method: "DELETE" });
  }
  logHabit(id, payload) {
    return this.request(`/api/habits/${id}/log`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  getHabitLogs(id, from, to) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    return this.request(`/api/habits/${id}/logs${query ? `?${query}` : ""}`);
  }
  getHabitsStats(from, to) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    return this.request(`/api/habits/stats${query ? `?${query}` : ""}`);
  }
  getTodos() {
    return this.request("/api/todos");
  }
  createTodo(payload) {
    return this.request("/api/todos", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  updateTodo(id, payload) {
    return this.request(`/api/todos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  }
  completeTodo(id) {
    return this.request(`/api/todos/${id}/complete`, { method: "POST" });
  }
  deleteTodo(id) {
    return this.request(`/api/todos/${id}`, { method: "DELETE" });
  }
  startFocus(payload) {
    return this.request("/api/focus/start", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  completeFocus(id, payload = {}) {
    return this.request(`/api/focus/${id}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
  cancelFocus(id) {
    return this.request(`/api/focus/${id}/cancel`, { method: "POST" });
  }
  getFocusToday() {
    return this.request("/api/focus/today");
  }
  getFocusRange(from, to) {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    return this.request(`/api/focus/range${query ? `?${query}` : ""}`);
  }
}

class Player {
  constructor() {
    this.name = "Adventurer";
    this.level = 1;
    this.xpTotal = 0;
    this.xpToNextLevel = 100;
    this.xp = 0;
    this.stats = { ...DEFAULT_STATS };
    this.forgeCoins = 0;
    this.currentRank = "Ember";
  }
  applyProgress(progress, user) {
    this.name = user?.name || user?.email || this.name || "Adventurer";
    this.level = progress?.level ?? 1;
    this.xpTotal = progress?.xpTotal ?? 0;
    this.xpToNextLevel = 100;
    this.xp = this.xpTotal % this.xpToNextLevel;
    this.forgeCoins = progress?.forgeCoins ?? 0;
    this.currentRank = progress?.rank || getRankTierForLevel(this.level).name;
  }
  ensureDefaultStats() {
    let updated = false;
    Object.keys(DEFAULT_STATS).forEach((key) => {
      if (typeof this.stats[key] !== "number") {
        this.stats[key] = DEFAULT_STATS[key];
        updated = true;
      }
    });
    return updated;
  }
}

class Habit {
  constructor(id, title, type, difficulty, color, createdAt, schedule) {
    this.id = id;
    this.name = title;
    this.type = type;
    this.difficulty = parseInt(difficulty, 10);
    if (Number.isNaN(this.difficulty)) this.difficulty = 1;
    this.color = color || "#58a6ff";
    this.history = {};
    this.schedule = schedule && typeof schedule === "object" ? schedule : null;
    this.createdAt = createdAt || Date.now();
  }
}

class HabitManager {
  constructor(app, savedHabits = []) {
    this.app = app;
    this.habits = (savedHabits || []).map(
      (h) =>
        new Habit(
          h.id,
          h.title,
          h.type,
          h.difficulty,
          h.color,
          h.createdAt,
          h.schedule
        )
    );
    this.init();
  }
  setHabitsFromData(savedHabits = []) {
    this.habits = (savedHabits || []).map(
      (h) =>
        new Habit(
          h.id,
          h.title,
          h.type,
          h.difficulty,
          h.color,
          h.createdAt,
          h.schedule
        )
    );
  }
  init() {
    this.renderCalendar();
    this.renderDailyQuests();
  }
  getDateKey(date) {
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
      date.getDate()
    )}`;
  }
  getDateFromKey(dateKey) {
    const [y, m, d] = dateKey.split("-").map((val) => parseInt(val, 10));
    return new Date(y, m - 1, d);
  }
  getWeekStart(date) {
    const d = new Date(date);
    const dayIndex = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayIndex);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  buildHeatmap(history, weeks, startDate) {
    const startWeek = this.getWeekStart(startDate || new Date());
    const totalDays = weeks * 7;
    let boxes = "";
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(startWeek);
      d.setDate(startWeek.getDate() + i);
      const isDone = history[this.getDateKey(d)];
      boxes += `<div class="heatmap-day ${isDone ? "completed" : ""}"></div>`;
    }
    let months = "";
    let prevMonth = "";
    for (let w = 0; w < weeks; w++) {
      const d = new Date(startWeek);
      d.setDate(startWeek.getDate() + w * 7);
      const label = d.toLocaleString("en-US", { month: "short" });
      if (label !== prevMonth) {
        months += `<span style="grid-column:${w + 1}">${label}</span>`;
        prevMonth = label;
      }
    }
    return { boxes, months, weeks };
  }
  getRewardLabel(habit) {
    const reward = REWARDS[habit.type]?.[habit.difficulty] || {
      xp: 0,
      coins: 0,
    };
    return `+${reward.xp} XP, +${reward.coins} FC`;
  }
  async loadLogsForVisibleRange(weeks = 26) {
    const startWeek = this.getWeekStart(new Date());
    const rangeStart = new Date(startWeek);
    rangeStart.setDate(startWeek.getDate() - weeks * 7);
    const from = getLocalDateKey(rangeStart);
    const to = getLocalDateKey(new Date());

    await Promise.all(
      this.habits.map(async (habit) => {
        const response = await this.app.api.getHabitLogs(habit.id, from, to);
        habit.history = {};
        const logs = response?.logs || [];
        logs.forEach((log) => {
          if (log.status === SUCCESS_STATUS[habit.type]) {
            const key = normalizeLogDateKey(log.date);
            habit.history[key] = true;
          }
        });
        if (DEBUG_LOGS) {
          const keys = Object.keys(habit.history);
          console.debug("habit logs", {
            habitId: habit.id,
            logs: logs.length,
            keys: keys.slice(0, 5),
          });
        }
      })
    );
  }
  async addHabit(title, type, difficulty, color, schedule) {
    const payload = {
      title,
      type,
      difficulty,
      color,
    };
    if (schedule) payload.schedule = schedule;
    const response = await this.app.api.createHabit(payload);
    const habit = response?.habit;
    if (!habit) return;
    this.habits.push(
      new Habit(
        habit.id,
        habit.title,
        habit.type,
        habit.difficulty,
        habit.color,
        habit.createdAt,
        habit.schedule
      )
    );
    this.app.statsCache.habit.clear();
    this.app.statsCache.global.clear();
    await this.loadLogsForVisibleRange();
    this.init();
    this.app.ui.refreshHabitDashboardIfVisible();
  }
  async deleteHabit(id) {
    if (!confirm("Delete this habit?")) return;
    await this.app.api.deleteHabit(id);
    this.habits = this.habits.filter((h) => h.id !== id);
    this.app.statsCache.habit.clear();
    this.app.statsCache.global.clear();
    this.init();
    this.app.ui.closeModal();
    this.app.ui.refreshHabitDashboardIfVisible();
  }
  async toggleDayStatus(id, dateKey) {
    const h = this.habits.find((habit) => habit.id === id);
    if (!h) return;
    const wasDone = Boolean(h.history[dateKey]);
    const desiredStatus = wasDone
      ? FAILURE_STATUS[h.type]
      : SUCCESS_STATUS[h.type];
    try {
      console.debug("habit:day-click", { habitId: h.id, dateKey });
      const response = await this.app.api.logHabit(h.id, {
        date: dateKey,
        status: desiredStatus,
      });
      const normalizedKey = normalizeLogDateKey(
        response?.log?.date || dateKey
      );
      if (response?.log?.status === SUCCESS_STATUS[h.type]) {
        h.history[normalizedKey] = true;
        showToast("Saved", "success");
      } else {
        delete h.history[normalizedKey];
        showToast("Updated", "success");
      }
      if (response?.progress) {
        this.app.player.applyProgress(response.progress, this.app.user);
        this.app.ui.updateStats();
      }
      this.app.statsCache.habit.clear();
      this.app.statsCache.global.clear();
      this.app.ui.refreshHabitDashboardIfVisible();
    } catch (err) {
      console.error(err);
    }
    this.init();
    if (this.app.ui.activeHabit?.id === id) this.app.ui.renderModalCalendar();
  }
  renderCalendar() {
    const container = document.getElementById("habits-calendar-list");
    if (!container) return;
    container.innerHTML = `
      <div class="habits-sections">
        <div class="habits-column">
          <div class="habits-header forge">Forge</div>
          <div id="forge-habits" class="habits-grid"></div>
        </div>
        <div class="habits-divider"></div>
        <div class="habits-column">
          <div class="habits-header purge">Purge</div>
          <div id="purge-habits" class="habits-grid"></div>
        </div>
      </div>
      `;
    const forgeContainer = document.getElementById("forge-habits");
    const purgeContainer = document.getElementById("purge-habits");
    const todayKey = this.getDateKey(new Date());
    this.habits.forEach((h) => {
      const heatmap = this.buildHeatmap(h.history, 26, h.createdAt);
      const streakSummary = this.app.ui?.getStreakSummary
        ? this.app.ui.getStreakSummary(h)
        : { currentStreak: 0, type: "DAILY" };
      const streakSuffix =
        streakSummary.type === "WEEKLY"
          ? "wk"
          : streakSummary.type === "MONTHLY"
          ? "mo"
          : "d";
      const streakLabel = `${streakSummary.currentStreak} ${streakSuffix}`;
      const totalSuccess = Object.values(h.history || {}).filter(
        (val) => val === true
      ).length;
      const card = document.createElement("div");
      const typeClass =
        h.type === "PURGE" ? "lf-card--purge" : "lf-card--forge";
      card.className = `habit-calendar-card lf-card lf-card--surface ${typeClass}`;
      card.style.setProperty("--habit-color", h.color);
      card.style.setProperty("--weeks", heatmap.weeks);
      if (this.app.ui.activeHabit?.id === h.id) {
        card.classList.add("lf-card--active");
      }
      if (h.history[todayKey]) {
        card.classList.add("lf-card--done");
      }
      // TODO: add lf-card--missed when overdue schedule data is available.
      card.onclick = (e) => {
        if (!e.target.closest(".btn-delete")) this.app.ui.openHabitModal(h);
      };
      card.innerHTML = `
        <div class="habit-card-head">
          <div class="habit-card-title">
            <h3>${h.name}</h3>
          </div>
          <div class="habit-card-badges">
            <span class="habit-streak">Streak ${streakLabel}</span>
            <span class="habit-total">Total ${totalSuccess}</span>
          </div>
          <div class="habit-card-actions">
            <button class="btn-secondary habit-stats-btn" onclick="event.stopPropagation(); app.ui.openHabitStatsModal('${h.id}')">
              Stats
            </button>
            <button class="btn-delete" onclick="event.stopPropagation(); app.habitManager.deleteHabit('${h.id}')">
              <i class="material-icons">delete</i>
            </button>
          </div>
        </div>
        <div class="heatmap-wrap">
          <div class="heatmap-months">${heatmap.months}</div>
          <div class="heatmap-body">
            <div class="heatmap-weekdays">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
            <div class="heatmap-grid">${heatmap.boxes}</div>
          </div>
        </div>
      `;
      if (h.type === "PURGE") {
        if (purgeContainer) purgeContainer.appendChild(card);
      } else if (forgeContainer) {
        forgeContainer.appendChild(card);
      }
    });
  }
  renderDailyQuests() {
    const container = document.getElementById("daily-quests-list");
    const futureContainer = document.getElementById("future-quests-list");
    if (!container || !futureContainer) return;
    container.innerHTML = "";
    futureContainer.innerHTML = "";
    const todayKey = this.getDateKey(new Date());
    const todayUtcKey = getUtcDateKey(new Date());
    this.habits.forEach((h) => {
      const isDone = h.history[todayKey];
      const rewardLabel = this.getRewardLabel(h);
      const card = document.createElement("div");
      const typeClass =
        h.type === "PURGE" ? "lf-card--purge" : "lf-card--forge";
      card.className = `daily-quest-card lf-card lf-card--surface ${typeClass}`;
      if (isDone) card.classList.add("lf-card--done");
      // TODO: add lf-card--missed when overdue schedule data is available.
      card.style.setProperty("--habit-color", h.color);
      card.innerHTML = `
          <div class="quest-info">
            <h4>${h.name}</h4>
            <small>${isDone ? "Done!" : `Reward: ${rewardLabel}`}</small>
        </div>
        <button class="btn-primary" ${
          isDone ? "disabled" : ""
        } onclick="app.habitManager.toggleDayStatus('${h.id}', '${todayKey}')">
          ${isDone ? "Done" : "Mark Done"}
        </button>
      `;
      container.appendChild(card);
    });
    const todos = this.app.todoManager?.todos || [];
    todos.forEach((todo) => {
      const dueKey = todo.dueDate ? getUtcDateKey(todo.dueDate) : null;
      const isToday = dueKey === todayUtcKey;
      const completed = this.app.todoManager.isCompleted(todo);
      const rewardLabel = this.app.todoManager.getRewardLabel(todo);
      const card = document.createElement("div");
      card.className = "daily-quest-card lf-card lf-card--surface";
      if (completed) card.classList.add("completed", "lf-card--done");
      card.style.setProperty("--habit-color", todo.color || "#58a6ff");
      card.innerHTML = `
          <div class="quest-info">
            <h4>${todo.title}</h4>
          <small>${completed ? "Done!" : `Reward: ${rewardLabel}`}</small>
        </div>
        <button class="btn-primary" ${completed ? "disabled" : ""}>
          ${completed ? "Done" : "Mark Done"}
        </button>
      `;
      const btn = card.querySelector("button");
      if (btn) {
        btn.addEventListener("click", () =>
          this.app.todoManager.toggleComplete(todo.id)
        );
      }
      if (isToday || (!todo.dueDate && todo.isDaily)) {
        container.appendChild(card);
      } else {
        const dueLabel = this.app.todoManager.formatDueDate(todo);
        if (dueLabel) {
          const meta = document.createElement("div");
          meta.className = "quest-meta";
          meta.textContent = `Due ${dueLabel}`;
          card.querySelector(".quest-info")?.appendChild(meta);
        }
        futureContainer.appendChild(card);
      }
    });
  }
}

class Todo {
  constructor(data) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description || "";
    this.priority = data.priority || "MEDIUM";
    this.color = data.color || "#58a6ff";
    this.xpReward = data.xpReward || 0;
    this.coinReward = data.coinReward || 0;
    this.isDaily = Boolean(data.isDaily);
    this.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    this.completedAt = data.completedAt ? new Date(data.completedAt) : null;
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
  }
}

class TodoManager {
  constructor(app, savedTodos = []) {
    this.app = app;
    this.todos = (savedTodos || []).map((todo) => new Todo(todo));
    this.init();
  }
  setTodosFromData(savedTodos = []) {
    this.todos = (savedTodos || []).map((todo) => new Todo(todo));
  }
  init() {
    this.renderTodos();
  }
  isCompleted(todo) {
    if (!todo.completedAt) return false;
    if (!todo.isDaily) return true;
    return getUtcDateKey(todo.completedAt) === getUtcDateKey(new Date());
  }
  getRewardLabel(todo) {
    const reward = getTodoReward(todo.priority);
    return `+${reward.xp} XP, +${reward.coins} FC`;
  }
  formatDueDate(todo) {
    if (!todo.dueDate) return "";
    return todo.dueDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  async addTodo(title, description, priority, isDaily, dueDate) {
    const response = await this.app.api.createTodo({
      title,
      description,
      priority,
      isDaily,
      dueDate,
      color: document.getElementById("todo-color").value,
    });
    if (!response?.todo) return;
    this.todos.push(new Todo(response.todo));
    this.renderTodos();
  }
  async deleteTodo(id) {
    if (!confirm("Delete this task?")) return;
    await this.app.api.deleteTodo(id);
    this.todos = this.todos.filter((todo) => todo.id !== id);
    this.renderTodos();
  }
  async toggleComplete(id) {
    try {
      const response = await this.app.api.completeTodo(id);
      const updated = response?.todo;
      if (!updated) return;
      this.todos = this.todos.map((todo) =>
        todo.id === id ? new Todo(updated) : todo
      );
      if (response?.progress) {
        this.app.player.applyProgress(response.progress, this.app.user);
        this.app.ui.updateStats();
      }
      this.renderTodos();
    } catch (err) {
      console.error(err);
    }
  }
  renderTodos() {
    const list = document.getElementById("todo-list");
    const empty = document.getElementById("todo-empty");
    if (!list || !empty) return;
    list.innerHTML = "";
    if (this.todos.length === 0) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");
    this.todos.forEach((todo) => {
      const completed = this.isCompleted(todo);
      const rewardLabel = this.getRewardLabel(todo);
      const dueLabel = this.formatDueDate(todo);
      const card = document.createElement("div");
      card.className = `todo-item ${completed ? "completed" : ""}`;
      card.style.setProperty("--todo-color", todo.color);
      card.innerHTML = `
        <label class="todo-check">
          <input type="checkbox" ${completed ? "checked" : ""} />
          <span class="todo-title">${todo.title}</span>
        </label>
        <div class="todo-meta">
          <span class="todo-priority ${todo.priority.toLowerCase()}">${
        todo.priority
      }</span>
          ${todo.isDaily ? '<span class="todo-chip">Daily</span>' : ""}
          ${dueLabel ? `<span class="todo-chip">Due ${dueLabel}</span>` : ""}
          <span class="todo-reward">${rewardLabel}</span>
          <button class="btn-delete" type="button">
            <i class="material-icons">delete</i>
          </button>
        </div>
        ${
          todo.description
            ? `<div class="todo-desc">${todo.description}</div>`
            : ""
        }
      `;
      const checkbox = card.querySelector("input");
      const deleteBtn = card.querySelector(".btn-delete");
      if (checkbox) {
        checkbox.addEventListener("change", () => this.toggleComplete(todo.id));
      }
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => this.deleteTodo(todo.id));
      }
      list.appendChild(card);
    });
    this.app.habitManager?.renderDailyQuests();
  }
}

class FocusSession {
  constructor(data) {
    this.id = data.id;
    this.durationMin = data.durationMin;
    this.type = data.type || "DEEP";
    this.startedAt = data.startedAt ? new Date(data.startedAt) : new Date();
    this.endedAt = data.endedAt ? new Date(data.endedAt) : null;
    this.completed = Boolean(data.completed);
    this.cancelled = Boolean(data.cancelled);
    this.todoId = data.todoId || null;
    this.notes = data.notes || "";
    this.xpAwarded = data.xpAwarded || 0;
    this.coinsAwarded = data.coinsAwarded || 0;
  }
}

class FocusManager {
  constructor(app, sessions = []) {
    this.app = app;
    this.sessions = (sessions || []).map(
      (session) => new FocusSession(session)
    );
    this.activeSession = null;
    this.timerInterval = null;
    this.timerEndsAt = null;
    this.selectedMinutes = 25;
    this.todayStats = null;
    this.bindUI();
    this.renderToday();
  }
  setSessionsFromData(sessions = []) {
    this.sessions = (sessions || []).map(
      (session) => new FocusSession(session)
    );
    this.renderToday();
  }
  bindUI() {
    const quickButtons = document.querySelectorAll(".focus-quick");
    const customInput = document.getElementById("focus-custom-min");
    const startBtn = document.getElementById("focus-start-btn");
    const completeBtn = document.getElementById("focus-complete-btn");
    const cancelBtn = document.getElementById("focus-cancel-btn");
    if (quickButtons.length > 0) {
      quickButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
          quickButtons.forEach((item) => item.classList.remove("active"));
          btn.classList.add("active");
          this.selectedMinutes = Number.parseInt(btn.dataset.min, 10) || 25;
          if (customInput) customInput.value = "";
          this.updateTimerDisplay(this.selectedMinutes * 60);
        });
      });
    }
    if (customInput) {
      customInput.addEventListener("input", () => {
        const value = Number.parseInt(customInput.value, 10);
        if (Number.isFinite(value) && value > 0) {
          this.selectedMinutes = value;
          quickButtons.forEach((item) => item.classList.remove("active"));
          this.updateTimerDisplay(this.selectedMinutes * 60);
        }
      });
    }
    if (startBtn) startBtn.addEventListener("click", () => this.startFocus());
    if (completeBtn)
      completeBtn.addEventListener("click", () => this.completeFocus());
    if (cancelBtn)
      cancelBtn.addEventListener("click", () => this.cancelFocus());
    this.updateTimerDisplay(this.selectedMinutes * 60);
    this.updateControls();
  }
  updateTimerDisplay(totalSeconds) {
    const display = document.getElementById("focus-timer-display");
    if (!display) return;
    const minutes = Math.max(0, Math.floor(totalSeconds / 60));
    const seconds = Math.max(0, totalSeconds % 60);
    display.textContent = `${pad2(minutes)}:${pad2(seconds)}`;
  }
  updateStatus(text) {
    const statusEl = document.getElementById("focus-status");
    if (statusEl) statusEl.textContent = text;
  }
  updateControls() {
    const startBtn = document.getElementById("focus-start-btn");
    const completeBtn = document.getElementById("focus-complete-btn");
    const cancelBtn = document.getElementById("focus-cancel-btn");
    const hasActive =
      this.activeSession &&
      !this.activeSession.completed &&
      !this.activeSession.cancelled;
    if (startBtn) startBtn.disabled = hasActive;
    if (completeBtn) completeBtn.disabled = !hasActive;
    if (cancelBtn) cancelBtn.disabled = !hasActive;
  }
  startTimer(durationMin) {
    this.stopTimer();
    this.timerEndsAt = Date.now() + durationMin * 60 * 1000;
    this.timerInterval = setInterval(() => {
      const remainingMs = this.timerEndsAt - Date.now();
      if (remainingMs <= 0) {
        this.updateTimerDisplay(0);
        this.stopTimer();
        this.updateStatus("Session ready to complete.");
        return;
      }
      const remainingSeconds = Math.ceil(remainingMs / 1000);
      this.updateTimerDisplay(remainingSeconds);
    }, 1000);
  }
  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = null;
    this.timerEndsAt = null;
  }
  getSelectedDuration() {
    const customInput = document.getElementById("focus-custom-min");
    const value = customInput ? Number.parseInt(customInput.value, 10) : null;
    if (Number.isFinite(value) && value > 0) return value;
    return this.selectedMinutes;
  }
  async startFocus() {
    if (
      this.activeSession &&
      !this.activeSession.completed &&
      !this.activeSession.cancelled
    ) {
      return;
    }
    const durationMin = this.getSelectedDuration();
    const typeSelect = document.getElementById("focus-type");
    const type = typeSelect ? typeSelect.value : "DEEP";
    try {
      this.updateStatus("Starting focus...");
      const response = await this.app.api.startFocus({ durationMin, type });
      if (!response?.session) return;
      this.activeSession = new FocusSession(response.session);
      this.startTimer(durationMin);
      this.updateStatus("Focus in progress.");
      this.updateControls();
      await this.refreshToday();
    } catch (err) {
      console.error(err);
      this.updateStatus("Failed to start focus.");
    }
  }
  async completeFocus() {
    if (!this.activeSession) return;
    try {
      const notes = window.prompt("What did you work on?", "") ?? "";
      const payload = {};
      if (notes !== undefined) payload.notes = notes;
      const response = await this.app.api.completeFocus(
        this.activeSession.id,
        payload
      );
      if (response?.progress) {
        this.app.player.applyProgress(response.progress, this.app.user);
        this.app.ui.updateStats();
      }
      this.activeSession = null;
      this.stopTimer();
      this.updateTimerDisplay(this.selectedMinutes * 60);
      this.updateStatus("Focus session completed.");
      this.updateControls();
      await this.refreshToday();
    } catch (err) {
      console.error(err);
      this.updateStatus("Failed to complete focus.");
    }
  }
  async cancelFocus() {
    if (!this.activeSession) return;
    try {
      const response = await this.app.api.cancelFocus(this.activeSession.id);
      if (response?.progress) {
        this.app.player.applyProgress(response.progress, this.app.user);
        this.app.ui.updateStats();
      }
      this.activeSession = null;
      this.stopTimer();
      this.updateTimerDisplay(this.selectedMinutes * 60);
      this.updateStatus("Focus session cancelled.");
      this.updateControls();
      await this.refreshToday();
    } catch (err) {
      console.error(err);
      this.updateStatus("Failed to cancel focus.");
    }
  }
  async refreshToday() {
    try {
      const response = await this.app.api.getFocusToday();
      if (!response) return;
      this.todayStats = response;
      this.sessions = (response.todaySessions || []).map(
        (session) => new FocusSession(session)
      );
      this.renderToday();
    } catch (err) {
      console.error(err);
    }
  }
  renderToday() {
    const list = document.getElementById("focus-today-list");
    const summaryEl = document.getElementById("focus-today-summary");
    const flowEl = document.getElementById("focus-flow-chain");
    const capEl = document.getElementById("focus-cap-status");
    if (!list) return;
    list.innerHTML = "";
    const stats = this.todayStats;
    if (summaryEl) {
      const sessionsCount = stats?.todayCompletedCount ?? 0;
      const minutes = stats?.todayTotalMinutes ?? 0;
      summaryEl.textContent = `${sessionsCount} sessions • ${minutes} min`;
    }
    if (flowEl) {
      const chain = stats?.flowChainDays ?? 0;
      flowEl.textContent = `${chain} days`;
    }
    if (capEl) {
      const xp = stats?.focusCapsStatus?.xp ?? 0;
      const coins = stats?.focusCapsStatus?.coins ?? 0;
      const xpCap = stats?.focusCapsStatus?.xpCap ?? 100;
      const coinsCap = stats?.focusCapsStatus?.coinsCap ?? 5;
      capEl.textContent = `Cap: ${xp}/${xpCap} XP • ${coins}/${coinsCap} FC`;
    }
    if (this.sessions.length === 0) {
      list.innerHTML = `<div class="focus-empty">No focus sessions yet.</div>`;
      return;
    }
    this.sessions.forEach((session) => {
      const card = document.createElement("div");
      card.className = "focus-item";
      if (session.completed) card.classList.add("completed");
      if (session.cancelled) card.classList.add("cancelled");
      const timeLabel = session.startedAt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
      const statusLabel = session.cancelled
        ? "Cancelled"
        : session.completed
        ? "Completed"
        : "In progress";
      card.innerHTML = `
        <div class="focus-item-main">
          <div>
            <div class="focus-item-title">${session.type} • ${
        session.durationMin
      } min</div>
            <div class="focus-item-meta">${timeLabel} • ${statusLabel}</div>
          </div>
          <div class="focus-item-reward">+${session.xpAwarded} XP / +${
        session.coinsAwarded
      } FC</div>
        </div>
        ${
          session.notes
            ? `<div class="focus-item-notes">${session.notes}</div>`
            : ""
        }
      `;
      list.appendChild(card);
    });
  }
}

class UI {
  constructor(app) {
    this.app = app;
    this.navItems = document.querySelectorAll(".nav-item");
    this.pages = document.querySelectorAll(".page");
    this.activeHabit = null;
    this.modalDate = new Date();
    this.activeHabitStats = null;
    this.habitStatsRangeDays = 30;
    this.dashboardRangeDays = 30;
    this.habitStatsShowTrend = true;
    this.habitStatsChart = null;
    this.dashboardChartSmall = null;
    this.dashboardChartLarge = null;
    this.dashboardModalState = this.loadDashboardModalState();
    this.dashboardScoreboardSort = "score";
    this.dashboardScoreboardQuery = "";
    this.habitStatsData = null;
    this.habitDashboardData = null;
    this.dashboardHoverIndex = null;
    this.authLocked = false;
    this.customSelectsReady = false;
    this.quotes = [
      {
        text: "We are what we repeatedly do. Excellence is not an act, but a habit.",
        author: "Aristotle",
      },
      {
        text: "Success is the sum of small efforts, repeated day in and day out.",
        author: "Robert Collier",
      },
      {
        text: "Discipline is choosing between what you want now and what you want most.",
        author: "Abraham Lincoln",
      },
      {
        text: "The future depends on what you do today.",
        author: "Mahatma Gandhi",
      },
      {
        text: "Great things are done by a series of small things brought together.",
        author: "Vincent van Gogh",
      },
      {
        text: "The secret of getting ahead is getting started.",
        author: "Mark Twain",
      },
      {
        text: "It always seems impossible until it is done.",
        author: "Nelson Mandela",
      },
      {
        text: "Action is the foundational key to all success.",
        author: "Pablo Picasso",
      },
    ];
    this.coreStats = [
      {
        key: "wisdom",
        name: "Wisdom",
        subtitle: "Mind",
        description: "Knowledge, awareness.",
        icon: "auto_awesome",
      },
      {
        key: "vitality",
        name: "Vitality",
        subtitle: "Body",
        description: "Body, energy, health.",
        icon: "favorite",
      },
      {
        key: "resolve",
        name: "Resolve",
        subtitle: "Discipline",
        description: "Willpower, resilience.",
        icon: "fitness_center",
      },
      {
        key: "flow",
        name: "Flow",
        subtitle: "Focus",
        description: "Rhythm, immersion.",
        icon: "schedule",
      },
      {
        key: "prosperity",
        name: "Prosperity",
        subtitle: "Wealth",
        description: "Resources and growth.",
        icon: "diamond",
      },
      {
        key: "inspiration",
        name: "Inspiration",
        subtitle: "Creativity",
        description: "Ideas and creation.",
        icon: "brush",
      },
    ];
  }
  initNavigation() {
    this.navItems.forEach((item) =>
      item.addEventListener("click", () => this.switchPage(item.dataset.target))
    );
  }
  initStatsModal() {
    const statsCard = document.getElementById("stats-card");
    const statsModal = document.getElementById("stats-modal");
    if (statsCard) {
      statsCard.addEventListener("click", () => this.openStatsModal());
    }
    if (statsModal) {
      statsModal.addEventListener("click", (event) => {
        if (event.target === statsModal) this.closeStatsModal();
      });
    }
  }
  initTreasuryModal() {
    const treasuryCard = document.getElementById("treasury-card");
    const treasuryModal = document.getElementById("treasury-modal");
    if (treasuryCard) {
      treasuryCard.addEventListener("click", () => this.openTreasuryModal());
    }
    if (treasuryModal) {
      treasuryModal.addEventListener("click", (event) => {
        if (event.target === treasuryModal) this.closeTreasuryModal();
      });
    }
  }
  initRankModal() {
    const rankCard = document.getElementById("rank-card");
    const rankModal = document.getElementById("rank-modal");
    if (rankCard) {
      rankCard.addEventListener("click", () => this.openRankModal());
    }
    if (rankModal) {
      rankModal.addEventListener("click", (event) => {
        if (event.target === rankModal) this.closeRankModal();
      });
    }
  }
  initHabitModal() {
    const habitModal = document.getElementById("habit-modal");
    if (habitModal) {
      habitModal.addEventListener("click", (event) => {
        if (event.target === habitModal) this.closeModal();
      });
    }
  }
  initHabitStatsModal() {
    const statsModal = document.getElementById("habit-stats-modal");
    const rangeButtons = document.querySelectorAll(".habit-range-btn");
    const trendToggle = document.getElementById("habit-trend-toggle");
    if (statsModal) {
      statsModal.addEventListener("click", (event) => {
        if (event.target === statsModal) this.closeHabitStatsModal();
      });
    }
    rangeButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        rangeButtons.forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        this.habitStatsRangeDays = Number.parseInt(btn.dataset.range, 10) || 30;
        if (this.activeHabitStats) {
          this.loadHabitStats(this.activeHabitStats);
        }
      })
    );
    if (trendToggle) {
      trendToggle.checked = true;
      trendToggle.disabled = true;
      this.habitStatsShowTrend = true;
    }
  }
  initHabitDashboard() {
    this.dashboardRangeDays = 30;
    const card = document.querySelector(".dashboard-clickable");
    if (card) {
      card.addEventListener("click", () => this.openHabitDashboardModal());
    }
    const modal = document.getElementById("habits-dashboard-modal");
    if (modal) {
      modal.addEventListener("click", (event) => {
        if (event.target === modal) this.closeHabitDashboardModal();
      });
    }
    const rangeButtons = document.querySelectorAll(
      "#habits-dashboard-modal .range-btn"
    );
    const filterInputs = document.querySelectorAll(
      "#habits-dashboard-modal .type-filters input"
    );
    const sortSelect = document.getElementById("dashboard-sort");
    const searchInput = document.getElementById("dashboard-search");
    rangeButtons.forEach((btn) => {
      const isActive =
        Number.parseInt(btn.dataset.range, 10) ===
        this.dashboardModalState.rangeDays;
      btn.classList.toggle("active", isActive);
    });
    filterInputs.forEach((input) => {
      if (input.value === "FORGE")
        input.checked = this.dashboardModalState.showForge;
      if (input.value === "PURGE")
        input.checked = this.dashboardModalState.showPurge;
    });
    if (sortSelect) {
      sortSelect.value = this.dashboardScoreboardSort;
    }
    if (searchInput) {
      searchInput.value = this.dashboardScoreboardQuery;
    }
    rangeButtons.forEach((btn) =>
      btn.addEventListener("click", () => {
        rangeButtons.forEach((item) => item.classList.remove("active"));
        btn.classList.add("active");
        this.dashboardModalState.rangeDays =
          Number.parseInt(btn.dataset.range, 10) || 30;
        this.saveDashboardModalState();
        this.renderHabitDashboardLarge();
      })
    );
    filterInputs.forEach((input) =>
      input.addEventListener("change", () => {
        if (input.value === "FORGE") {
          this.dashboardModalState.showForge = input.checked;
        }
        if (input.value === "PURGE") {
          this.dashboardModalState.showPurge = input.checked;
        }
        this.saveDashboardModalState();
        this.renderHabitDashboardLarge();
        this.renderHabitDashboardSmall();
      })
    );
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        this.dashboardScoreboardSort = sortSelect.value;
        this.renderHabitDashboardLarge();
      });
    }
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        this.dashboardScoreboardQuery = searchInput.value;
        this.renderHabitDashboardLarge();
      });
    }
    this.renderHabitDashboardSmall();
  }
  initModalScroll() {
    const contents = document.querySelectorAll(".modal-content");
    contents.forEach((content) => {
      const body = content.querySelector(".modal-body");
      if (!body) return;
      let fade = content.querySelector(".scroll-fade-bottom");
      if (!fade) {
        fade = document.createElement("div");
        fade.className = "scroll-fade-bottom";
        fade.setAttribute("aria-hidden", "true");
        content.appendChild(fade);
      }
      let scrollBtn = content.querySelector(".modal-scroll-top");
      if (!scrollBtn) {
        scrollBtn = document.createElement("button");
        scrollBtn.type = "button";
        scrollBtn.className = "modal-scroll-top";
        scrollBtn.setAttribute("aria-label", "Scroll to top");
        scrollBtn.innerHTML = '<i class="material-icons">keyboard_arrow_up</i>';
        content.appendChild(scrollBtn);
      }
      const update = () =>
        this.updateModalScrollState(content, body, scrollBtn);
      body.addEventListener("scroll", update);
      scrollBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        body.scrollTo({ top: 0, behavior: "smooth" });
      });
      update();
    });
  }
  initCardSystemV2() {
    const selectors = [
      ".habit-shell",
      ".habit-dashboard-card",
      ".xp-rules-card",
      ".lf-chart-card",
      ".quests-section",
      ".account-panel",
      ".kpi-card",
      ".stat-card",
      ".auth-card",
      ".todo-shell",
      ".focus-shell",
      ".focus-panel",
      ".focus-journal",
    ];
    document.querySelectorAll(selectors.join(",")).forEach((card) => {
      card.classList.add("lf-card");
      if (
        !card.classList.contains("lf-card--surface") &&
        !card.classList.contains("lf-card--focus") &&
        !card.classList.contains("lf-card--core")
      ) {
        card.classList.add("lf-card--surface");
      }
    });
  }
  updateModalScrollState(content, body, scrollBtn) {
    const atBottom =
      body.scrollTop + body.clientHeight >= body.scrollHeight - 2;
    content.classList.toggle("is-at-bottom", atBottom);
    if (scrollBtn) {
      scrollBtn.classList.toggle("is-visible", body.scrollTop > 200);
    }
  }
  refreshModalScroll(modalEl) {
    if (!modalEl) return;
    const content = modalEl.querySelector(".modal-content");
    const body = content?.querySelector(".modal-body");
    const scrollBtn = content?.querySelector(".modal-scroll-top");
    if (!content || !body) return;
    this.updateModalScrollState(content, body, scrollBtn);
  }
  updateModalLock() {
    const anyOpen = Array.from(document.querySelectorAll(".modal")).some(
      (modal) => modal.style.display === "flex"
    );
    document.body.classList.toggle("modal-open", anyOpen);
  }
  initModalEscapeClose() {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      this.closeHabitDashboardModal();
      this.closeHabitStatsModal();
      this.closeModal();
      this.closeRankModal();
      this.closeStatsModal();
      this.closeTreasuryModal();
    });
  }
  initColorSelector() {
    const dots = document.querySelectorAll(".habit-color-dot");
    const hidden = document.getElementById("habit-color");
    dots.forEach((dot) =>
      dot.addEventListener("click", () => {
        dots.forEach((d) => d.classList.remove("active"));
        dot.classList.add("active");
        hidden.value = dot.dataset.color;
      })
    );
  }
  closeCustomSelects() {
    document.querySelectorAll(".lf-select.open").forEach((wrapper) => {
      wrapper.classList.remove("open");
      const trigger = wrapper.querySelector(".lf-select-trigger");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }
  initCustomSelects() {
    const selects = document.querySelectorAll("select.lf-select-native");
    if (selects.length === 0) return;

    if (!this.customSelectsReady) {
      document.addEventListener("click", (event) => {
        if (!event.target.closest(".lf-select")) {
          this.closeCustomSelects();
        }
      });
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.closeCustomSelects();
      });
      this.customSelectsReady = true;
    }

    selects.forEach((select) => {
      if (select.closest(".lf-select")) return;

      const wrapper = document.createElement("div");
      wrapper.className = "lf-select";
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "lf-select-trigger";
      trigger.setAttribute("aria-haspopup", "listbox");
      trigger.setAttribute("aria-expanded", "false");

      const menu = document.createElement("div");
      menu.className = "lf-select-menu";
      menu.setAttribute("role", "listbox");

      const syncFromSelect = () => {
        const selected = select.options[select.selectedIndex];
        trigger.textContent = selected ? selected.text : "";
        menu.querySelectorAll(".lf-select-option").forEach((optionBtn) => {
          optionBtn.classList.toggle(
            "active",
            optionBtn.dataset.value === select.value
          );
        });
      };

      Array.from(select.options).forEach((option) => {
        if (option.disabled || option.value === "") return;
        const optionBtn = document.createElement("button");
        optionBtn.type = "button";
        optionBtn.className = "lf-select-option";
        optionBtn.dataset.value = option.value;
        optionBtn.setAttribute("role", "option");
        optionBtn.textContent = option.text;
        optionBtn.addEventListener("click", () => {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          this.closeCustomSelects();
        });
        menu.appendChild(optionBtn);
      });

      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        const isOpen = wrapper.classList.contains("open");
        this.closeCustomSelects();
        if (!isOpen) {
          wrapper.classList.add("open");
          trigger.setAttribute("aria-expanded", "true");
        }
      });

      wrapper.addEventListener("keydown", (event) => {
        if (event.key === "Escape") this.closeCustomSelects();
      });

      select.addEventListener("change", syncFromSelect);

      wrapper.appendChild(trigger);
      wrapper.appendChild(menu);
      syncFromSelect();
    });
  }
  initTodoColorSelector() {
    const dots = document.querySelectorAll(".todo-color-dot");
    const hidden = document.getElementById("todo-color");
    dots.forEach((dot) =>
      dot.addEventListener("click", () => {
        dots.forEach((d) => d.classList.remove("active"));
        dot.classList.add("active");
        hidden.value = dot.dataset.color;
      })
    );
  }
  initXpDisplay() {
    const typeSelect = document.getElementById("habit-type");
    const difficultySelect = document.getElementById("habit-difficulty");
    const streakTypeSelect = document.getElementById("habit-streak-type");
    const streakCountInput = document.getElementById("habit-streak-count");
    const addButton = document.getElementById("add-habit-btn");
    if (!typeSelect) return;
    const update = () => {
      const isForge = typeSelect.value === "FORGE";
      typeSelect.classList.toggle("forge", isForge);
      typeSelect.classList.toggle("purge", !isForge);
      if (difficultySelect) {
        difficultySelect.classList.toggle("forge", isForge);
        difficultySelect.classList.toggle("purge", !isForge);
      }
      if (streakTypeSelect) {
        streakTypeSelect.classList.toggle("forge", isForge);
        streakTypeSelect.classList.toggle("purge", !isForge);
      }
      if (streakCountInput) {
        streakCountInput.classList.toggle("forge", isForge);
        streakCountInput.classList.toggle("purge", !isForge);
      }
      const nameField = document.querySelector(".name-field");
      if (nameField) {
        nameField.classList.toggle("forge", isForge);
        nameField.classList.toggle("purge", !isForge);
      }
      const colorSelector = document.querySelector(".color-selector");
      if (colorSelector) {
        colorSelector.classList.toggle("forge", isForge);
        colorSelector.classList.toggle("purge", !isForge);
      }
      if (addButton) {
        addButton.classList.toggle("forge", isForge);
        addButton.classList.toggle("purge", !isForge);
      }
      const rulesCards = document.querySelectorAll(
        ".habit-shell .xp-rules-card"
      );
      rulesCards.forEach((card) => {
        card.classList.toggle("forge", isForge);
        card.classList.toggle("purge", !isForge);
      });
    };
    typeSelect.addEventListener("change", update);
    update();
  }
  switchPage(id, options = {}) {
    if (this.authLocked && id !== "auth" && !options.force) return;
    this.pages.forEach((p) => p.classList.remove("active"));
    this.navItems.forEach((n) => n.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");
    const navItem = document.querySelector(`[data-target="${id}"]`);
    if (navItem) navItem.classList.add("active");
  }
  setAuthLocked(locked) {
    this.authLocked = locked;
    document.body.classList.toggle("auth-locked", locked);
    this.navItems.forEach((item) => item.classList.toggle("disabled", locked));
    this.switchPage(locked ? "auth" : "dashboard", { force: true });
  }
  updateStats() {
    const p = this.app.player;
    document.getElementById("player-name-display").innerText = p.name;
    document.querySelector(
      ".rank-title"
    ).innerText = `${p.currentRank} - Level ${p.level}`;
    document.getElementById("lvl-main").innerText = p.level;
    document.getElementById("xp-val").innerText = p.xp;
    document.getElementById("xp-max").innerText = p.xpToNextLevel;
    document.getElementById("xp-bar-fill").style.width = `${
      (p.xp / p.xpToNextLevel) * 100
    }%`;
    const forgeEl = document.getElementById("forgecoins-balance");
    if (forgeEl) forgeEl.innerText = p.forgeCoins;

    const tiers = RANK_TIERS;
    const normalizedLevel = Math.max(1, p.level);
    const currentRankIndex = Math.max(
      0,
      tiers.findIndex(
        (tier) => normalizedLevel >= tier.min && normalizedLevel <= tier.max
      )
    );
    const nextRankIndex = Math.min(currentRankIndex + 1, tiers.length - 1);
    const rankCurrentEl = document.getElementById("rank-current");
    const rankNextEl = document.getElementById("rank-next");
    const rankFillEl = document.getElementById("rank-progress-fill");
    const rankTextEl = document.getElementById("rank-progress-text");
    const rankCardEl = document.getElementById("rank-card");
    if (rankCurrentEl)
      rankCurrentEl.innerText = tiers[currentRankIndex]?.name || "";
    if (rankNextEl) {
      rankNextEl.innerText =
        currentRankIndex === tiers.length - 1
          ? "Max rank"
          : tiers[nextRankIndex]?.name || "";
    }
    const currentTier = tiers[currentRankIndex];
    const levelInRank = normalizedLevel - (currentTier?.min || 1);
    const levelInRankDisplay = p.level === 0 ? 0 : levelInRank + 1;
    const levelsInTier = Math.max(
      1,
      (currentTier?.max || normalizedLevel) - (currentTier?.min || 1) + 1
    );
    const rankProgress =
      p.level === 0
        ? 0
        : currentRankIndex === tiers.length - 1
        ? 100
        : Math.round((levelInRank / levelsInTier) * 100);
    if (rankFillEl) rankFillEl.style.width = `${rankProgress}%`;
    if (rankTextEl) {
      const targetLevel = levelsInTier;
      rankTextEl.innerText = `Level ${levelInRankDisplay} / ${targetLevel}`;
    }
    if (rankCardEl && currentTier?.color) {
      rankCardEl.style.borderColor = currentTier.color;
      rankCardEl.style.borderWidth = "2px";
      rankCardEl.style.boxShadow = `0 18px 35px rgba(0, 0, 0, 0.35), 0 0 0 1px ${currentTier.color}, 0 0 18px ${currentTier.color}`;
    }
    if (rankFillEl && currentTier?.color) {
      rankFillEl.style.background = `linear-gradient(90deg, ${currentTier.color}, #58a6ff)`;
    }
  }
  updateDailyQuote() {
    const textEl = document.getElementById("quote-text");
    const authorEl = document.getElementById("quote-author");
    if (!textEl || !authorEl || this.quotes.length === 0) return;
    const now = new Date();
    const dayIndex = Math.floor(
      (Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) -
        Date.UTC(now.getFullYear(), 0, 0)) /
        86400000
    );
    const quote = this.quotes[dayIndex % this.quotes.length];
    textEl.textContent = quote.text;
    authorEl.textContent = `"${quote.author}"`;
  }
  openStatsModal() {
    const statsModal = document.getElementById("stats-modal");
    const list = document.getElementById("stats-list");
    if (!statsModal || !list) return;
    const stats = this.app.player.stats || DEFAULT_STATS;
    list.innerHTML = "";
    this.coreStats.forEach((stat) => {
      const item = document.createElement("div");
      item.className = "stats-item";
      const value = stats[stat.key] ?? DEFAULT_STATS[stat.key];
      item.innerHTML = `
        <div class="stats-item-head">
          <div class="stats-item-title">
            <i class="material-icons">${stat.icon}</i>
            <div>${stat.name}</div>
          </div>
          <div class="stats-value">${value}</div>
        </div>
        <div class="stats-item-desc">${stat.description}</div>
      `;
      list.appendChild(item);
    });
    statsModal.style.display = "flex";
    this.updateModalLock();
    requestAnimationFrame(() => this.refreshModalScroll(statsModal));
  }
  closeStatsModal() {
    const statsModal = document.getElementById("stats-modal");
    if (statsModal) statsModal.style.display = "none";
    this.updateModalLock();
  }
  openTreasuryModal() {
    const treasuryModal = document.getElementById("treasury-modal");
    const balanceEl = document.getElementById("treasury-balance");
    if (!treasuryModal) return;
    if (balanceEl) balanceEl.innerText = this.app.player.forgeCoins;
    treasuryModal.style.display = "flex";
    this.updateModalLock();
    requestAnimationFrame(() => this.refreshModalScroll(treasuryModal));
  }
  closeTreasuryModal() {
    const treasuryModal = document.getElementById("treasury-modal");
    if (treasuryModal) treasuryModal.style.display = "none";
    this.updateModalLock();
  }
  openRankModal() {
    const rankModal = document.getElementById("rank-modal");
    const list = document.getElementById("rank-list");
    if (!rankModal || !list) return;
    const normalizedLevel = Math.max(1, this.app.player.level);
    const currentIndex = Math.max(
      0,
      RANK_TIERS.findIndex(
        (tier) => normalizedLevel >= tier.min && normalizedLevel <= tier.max
      )
    );
    const currentTier = RANK_TIERS[currentIndex];
    if (currentTier?.color) {
      rankModal.style.setProperty("--rank-color", currentTier.color);
    }
    list.innerHTML = "";
    RANK_TIERS.forEach((tier, index) => {
      const item = document.createElement("div");
      item.className = "rank-item";
      item.style.setProperty("--rank-color", tier.color);
      if (index === currentIndex) {
        item.classList.add("current");
        item.style.borderColor = tier.color;
      }
      item.innerHTML = `
        <div class="rank-item-header">
          <div class="rank-badge">
            <span class="rank-dot"></span>
            <span>${tier.name}</span>
          </div>
          <span class="rank-range">Levels ${tier.min}-${tier.max}</span>
        </div>
        <div class="rank-quote">${tier.tagline}</div>
      `;
      list.appendChild(item);
      if (index === currentIndex) {
        requestAnimationFrame(() => {
          item.scrollIntoView({ block: "center" });
        });
      }
    });
    rankModal.style.display = "flex";
    this.updateModalLock();
    requestAnimationFrame(() => this.refreshModalScroll(rankModal));
  }
  closeRankModal() {
    const rankModal = document.getElementById("rank-modal");
    if (rankModal) rankModal.style.display = "none";
    this.updateModalLock();
  }
  refreshHabitDashboardIfVisible() {
    if (document.getElementById("weekly-progress-bars")) {
      this.renderHabitDashboardSmall();
    }
    const modal = document.getElementById("habits-dashboard-modal");
    if (modal && modal.style.display === "flex") {
      this.renderHabitDashboardLarge();
    }
  }
  openHabitStatsModal(habitId) {
    const habit = this.app.habitManager?.habits.find((h) => h.id === habitId);
    if (!habit) return;
    this.activeHabitStats = habit;
    const modal = document.getElementById("habit-stats-modal");
    if (!modal) return;
    modal.style.display = "flex";
    this.updateModalLock();
    modal.style.setProperty("--habit-color", habit.color);
    const titleEl = document.getElementById("habit-stats-title");
    if (titleEl) titleEl.textContent = habit.name;
    const trendToggle = document.getElementById("habit-trend-toggle");
    if (trendToggle) {
      trendToggle.checked = true;
      trendToggle.disabled = true;
    }
    this.habitStatsShowTrend = true;
    const rangeButtons = document.querySelectorAll(".habit-range-btn");
    rangeButtons.forEach((btn) => {
      const isActive =
        Number.parseInt(btn.dataset.range, 10) === this.habitStatsRangeDays;
      btn.classList.toggle("active", isActive);
    });
    requestAnimationFrame(() => {
      this.loadHabitStats(habit);
      requestAnimationFrame(() => {
        if (this.habitStatsChart) this.habitStatsChart.resize();
        this.refreshModalScroll(modal);
      });
    });
  }
  closeHabitStatsModal() {
    const modal = document.getElementById("habit-stats-modal");
    if (modal) modal.style.display = "none";
    this.updateModalLock();
    this.activeHabitStats = null;
  }
  openHabitDashboardModal() {
    const modal = document.getElementById("habits-dashboard-modal");
    if (!modal) return;
    modal.style.display = "flex";
    this.updateModalLock();
    this.renderHabitDashboardLarge();
    requestAnimationFrame(() => {
      if (this.dashboardChartLarge) this.dashboardChartLarge.resize();
      this.refreshModalScroll(modal);
    });
  }
  closeHabitDashboardModal() {
    const modal = document.getElementById("habits-dashboard-modal");
    if (modal) modal.style.display = "none";
    this.updateModalLock();
  }
  loadDashboardModalState() {
    const range = Number.parseInt(
      localStorage.getItem(DASHBOARD_RANGE_KEY),
      10
    );
    const showForge = localStorage.getItem(DASHBOARD_FORGE_KEY);
    const showPurge = localStorage.getItem(DASHBOARD_PURGE_KEY);
    return {
      rangeDays: [30, 90].includes(range) ? range : 30,
      showForge: showForge === null ? true : showForge === "true",
      showPurge: showPurge === null ? true : showPurge === "true",
    };
  }
  saveDashboardModalState() {
    localStorage.setItem(
      DASHBOARD_RANGE_KEY,
      String(this.dashboardModalState.rangeDays)
    );
    localStorage.setItem(
      DASHBOARD_FORGE_KEY,
      String(this.dashboardModalState.showForge)
    );
    localStorage.setItem(
      DASHBOARD_PURGE_KEY,
      String(this.dashboardModalState.showPurge)
    );
  }
  async loadHabitStats(habit) {
    if (!habit || !this.app.user) return;
    const range = getLocalRangeFromDays(this.habitStatsRangeDays);
    const cacheKey = `${habit.id}|${range.from}|${range.to}`;
    let logs = this.app.statsCache.habit.get(cacheKey);
    if (!logs) {
      try {
        const response = await this.app.api.getHabitLogs(
          habit.id,
          range.from,
          range.to
        );
        logs = response?.logs || [];
        this.app.statsCache.habit.set(cacheKey, logs);
      } catch (err) {
        console.error(err);
        logs = [];
      }
    }
    this.habitStatsData = { range, logs };
    this.renderHabitStats(habit, this.habitStatsData);
  }
  renderHabitStats(habit, statsData) {
    const modalEl = document.getElementById("habit-stats-modal");
    const { range, logs } = statsData;
    const emptyEl = document.getElementById("habit-stats-empty");
    const logDates = logs.map((log) => normalizeLogDateKey(log.date));
    if (logDates.length === 0) {
      if (emptyEl) emptyEl.classList.remove("hidden");
      const last7El = document.getElementById("habit-stat-last7");
      const last30El = document.getElementById("habit-stat-last30");
      const currentStreakEl = document.getElementById(
        "habit-stat-current-streak"
      );
      const intervalEl = document.getElementById("habit-stat-interval");
      const resetEl = document.getElementById("habit-stat-reset");
      const bestEl = document.getElementById("habit-stat-best");
      const momentumEl = document.getElementById("habit-stat-momentum");
      const streakSummary = this.getStreakSummary(habit);
      const streakSuffix =
        streakSummary.type === "WEEKLY"
          ? "wk"
          : streakSummary.type === "MONTHLY"
          ? "mo"
          : "d";
      if (last7El) last7El.textContent = "0%";
      if (last30El) last30El.textContent = "0%";
      if (currentStreakEl) {
        currentStreakEl.textContent = `${streakSummary.currentStreak} ${streakSuffix}`;
      }
      if (intervalEl) {
        intervalEl.textContent = `${streakSummary.intervalDone}/${streakSummary.required} ${streakSummary.intervalLabel}`;
      }
      if (resetEl) {
        resetEl.textContent = streakSummary.nextResetDate
          ? streakSummary.nextResetDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          : "--";
      }
      if (bestEl)
        bestEl.textContent = `${streakSummary.bestStreak} ${streakSuffix}`;
      if (momentumEl) momentumEl.textContent = "Getting started";
      if (this.habitStatsChart) this.habitStatsChart.destroy();
      this.habitStatsChart = null;
      this.refreshModalScroll(modalEl);
      return;
    }

    const firstLogDate = logDates.reduce((earliest, dateKey) => {
      if (!earliest) return dateKey;
      return parseLocalDateKey(dateKey) < parseLocalDateKey(earliest)
        ? dateKey
        : earliest;
    }, null);
    const chartStart = (() => {
      const fallback = range.from;
      const candidate = firstLogDate
        ? addLocalDays(firstLogDate, -1)
        : fallback;
      return parseLocalDateKey(candidate) > parseLocalDateKey(fallback)
        ? candidate
        : fallback;
    })();
    const labels = buildLocalDateRangeKeys(chartStart, range.to);
    const statusByDate = new Map();
    logs.forEach((log) =>
      statusByDate.set(normalizeLogDateKey(log.date), log.status)
    );
    const successValue = SUCCESS_STATUS[habit.type];
    const values = labels.map((dateKey) =>
      statusByDate.get(dateKey) === successValue ? 1 : 0
    );
    const last7 = values.slice(-7);
    const last30 = values.slice(-30);
    const last7Consistency = last7.length
      ? Math.round(
          (last7.reduce((sum, val) => sum + val, 0) / last7.length) * 100
        )
      : 0;
    const last30Consistency = last30.length
      ? Math.round(
          (last30.reduce((sum, val) => sum + val, 0) / last30.length) * 100
        )
      : 0;
    const prev7 = values.slice(-14, -7);
    const prev7Consistency = prev7.length
      ? Math.round(
          (prev7.reduce((sum, val) => sum + val, 0) / prev7.length) * 100
        )
      : 0;

    const streakSummary = this.getStreakSummary(habit);
    const streakSuffix =
      streakSummary.type === "WEEKLY"
        ? "wk"
        : streakSummary.type === "MONTHLY"
        ? "mo"
        : "d";

    const last7El = document.getElementById("habit-stat-last7");
    const last30El = document.getElementById("habit-stat-last30");
    const currentStreakEl = document.getElementById(
      "habit-stat-current-streak"
    );
    const intervalEl = document.getElementById("habit-stat-interval");
    const resetEl = document.getElementById("habit-stat-reset");
    const bestEl = document.getElementById("habit-stat-best");
    const momentumEl = document.getElementById("habit-stat-momentum");
    if (last7El) last7El.textContent = `${last7Consistency}%`;
    if (last30El) last30El.textContent = `${last30Consistency}%`;
    if (currentStreakEl) {
      currentStreakEl.textContent = `${streakSummary.currentStreak} ${streakSuffix}`;
    }
    if (intervalEl) {
      intervalEl.textContent = `${streakSummary.intervalDone}/${streakSummary.required} ${streakSummary.intervalLabel}`;
    }
    if (resetEl) {
      resetEl.textContent = streakSummary.nextResetDate
        ? streakSummary.nextResetDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })
        : "--";
    }
    if (bestEl)
      bestEl.textContent = `${streakSummary.bestStreak} ${streakSuffix}`;
    if (momentumEl) {
      const basis = last30.length ? last30Consistency : last7Consistency;
      momentumEl.textContent = getMomentumLabel(basis);
    }
    if (emptyEl) {
      emptyEl.textContent =
        "No data yet. Complete this habit to forge your first mark.";
      emptyEl.classList.add("hidden");
    }

    const scoreEl = document.getElementById("habit-score-value");
    const rankEl = document.getElementById("habit-score-rank");
    const momentumValueEl = document.getElementById("habit-momentum-value");
    const momentumLabelEl = document.getElementById("habit-momentum-label");
    const riskEl = document.getElementById("habit-risk-status");
    const riskCard = document.getElementById("habit-risk-card");
    const streakFactor = streakSummary.bestStreak
      ? Math.round(
          (streakSummary.currentStreak / streakSummary.bestStreak) * 100
        )
      : 0;
    const habitScore = Math.round(
      last7Consistency * 0.45 + last30Consistency * 0.35 + streakFactor * 0.2
    );
    const boundedScore = Math.max(0, Math.min(100, habitScore));
    const rank =
      boundedScore >= 90
        ? "S"
        : boundedScore >= 80
        ? "A"
        : boundedScore >= 70
        ? "B"
        : "C";
    if (scoreEl) scoreEl.textContent = `${boundedScore}`;
    if (rankEl) {
      rankEl.textContent = rank;
      rankEl.classList.remove("rank-s", "rank-a", "rank-b", "rank-c");
      rankEl.classList.add(`rank-${rank.toLowerCase()}`);
    }
    if (momentumValueEl) {
      const delta = Math.round(last7Consistency - prev7Consistency);
      const arrow = delta > 1 ? "&#9650;" : delta < -1 ? "&#9660;" : "&#8594;";
      momentumValueEl.innerHTML = `${arrow} ${Math.abs(delta)}%`;
      momentumValueEl.classList.remove("is-up", "is-down", "is-flat");
      momentumValueEl.classList.add(
        delta > 1 ? "is-up" : delta < -1 ? "is-down" : "is-flat"
      );
      if (momentumLabelEl) {
        momentumLabelEl.textContent =
          delta > 1
            ? "Building momentum"
            : delta < -1
            ? "Losing momentum"
            : "Stable";
      }
    }

    const habitConsistency = (() => {
      const historyKeys = Object.keys(habit.history || {});
      if (historyKeys.length === 0) return 0;
      let earliest = null;
      historyKeys.forEach((dateKey) => {
        const date = parseLocalDateKey(dateKey);
        if (!date) return;
        date.setHours(0, 0, 0, 0);
        if (!earliest || date < earliest) earliest = date;
      });
      if (!earliest) return 0;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let tracked = 0;
      let done = 0;
      const cursor = new Date(earliest);
      while (cursor <= today) {
        const dateKey = getLocalDateKey(cursor);
        tracked += 1;
        if (habit.history?.[dateKey]) done += 1;
        cursor.setDate(cursor.getDate() + 1);
      }
      return tracked ? Math.round((done / tracked) * 100) : 0;
    })();

    if (riskEl) riskEl.textContent = `${habitConsistency}%`;
    if (riskCard) {
      const labelEl = riskCard.querySelector(".kpi-label");
      const subtextEl = riskCard.querySelector(".kpi-subtext");
      if (labelEl) labelEl.textContent = "Consistency";
      if (subtextEl) subtextEl.textContent = "Since first activity";
      riskCard.classList.remove("at-risk");
      riskCard.onclick = null;
    }

    const breakIndices = [];
    let breakStreak = 0;
    for (let i = 0; i < values.length - 1; i += 1) {
      if (values[i] === 1) {
        breakStreak += 1;
      } else {
        breakStreak = 0;
      }
      if (values[i] === 1 && values[i + 1] === 0 && breakStreak >= 3) {
        breakIndices.push(i + 1);
      }
      if (values[i] === 0) breakStreak = 0;
    }

    this.renderHabitStatsChart(habit, {
      labels,
      values,
      logs,
      breakIndices,
      firstLogDate,
    });
    this.refreshModalScroll(modalEl);
  }
  renderHabitStatsChart(habit, data) {
    const canvas = document.getElementById("habit-consistency-chart");
    if (!canvas || typeof Chart === "undefined") return;
    const axisLabels = { zero: "Missed", one: "Done" };
    const labels = data.labels;
    const statusByDate = new Map();
    (data.logs || []).forEach((log) =>
      statusByDate.set(normalizeLogDateKey(log.date), log.status)
    );
    const successValue = SUCCESS_STATUS[habit.type];
    const values = labels.map((dateKey) =>
      statusByDate.get(dateKey) === successValue ? 1 : 0
    );

    const normalized = computeNormalizedSeries(
      labels.map((label, index) => ({
        date: label,
        done: values[index] === 1,
      })),
      habit.type === "PURGE" ? "purge" : "forge"
    );
    const trendValues = rollingAverage(normalized.values, 7);
    const breakMarkers = (() => {
      const indices = [];
      let streak = 0;
      for (let i = 0; i < values.length - 1; i += 1) {
        if (values[i] === 1) {
          streak += 1;
        } else {
          streak = 0;
        }
        if (values[i] === 1 && values[i + 1] === 0 && streak >= 3) {
          indices.push(i + 1);
        }
        if (values[i] === 0) streak = 0;
      }
      return indices;
    })();
    const consistencyPoints = normalized.values.map((value, index) => ({
      x: normalized.labels[index],
      y: value,
      completed: normalized.meta.completed[index],
      missedStreak: normalized.meta.missedStreaks[index],
    }));
    const datasets = [
      {
        label: "Consistency",
        data: consistencyPoints,
        borderColor: habit.color,
        backgroundColor: (context) =>
          makeChartGradient(context.chart, habit.color),
        borderWidth: 2.5,
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointBackgroundColor: habit.color,
        pointBorderColor: "#0d1117",
        pointBorderWidth: 1,
        tension: 0.25,
        fill: true,
      },
    ];
    datasets.push({
      label: "7-day trend",
      data: trendValues.map((value, index) => ({
        x: normalized.labels[index],
        y: value,
      })),
      borderColor: hexToRgba(habit.color, 0.5),
      borderDash: [6, 6],
      borderWidth: 1.5,
      pointRadius: 0,
      tension: 0.25,
      fill: false,
      tooltip: { enabled: false },
    });
    const breakMarkerPlugin = {
      id: "habitBreakMarkers",
      afterDatasetsDraw(chart) {
        if (!breakMarkers.length) return;
        const { ctx, chartArea, scales } = chart;
        ctx.save();
        ctx.strokeStyle = "rgba(201, 209, 217, 0.25)";
        ctx.lineWidth = 1;
        breakMarkers.forEach((index) => {
          const x = scales.x.getPixelForValue(index);
          ctx.beginPath();
          ctx.moveTo(x, chartArea.top);
          ctx.lineTo(x, chartArea.bottom);
          ctx.stroke();
        });
        ctx.restore();
      },
    };
    if (this.habitStatsChart) this.habitStatsChart.destroy();
    this.habitStatsChart = new Chart(canvas, {
      type: "line",
      plugins: [breakMarkerPlugin, DoneMissedAxisLabelsPlugin],
      data: {
        labels: normalized.labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: "#8b949e",
              font: { size: 13 },
            },
          },
          tooltip: {
            filter: (item) => item.dataset.label === "Consistency",
            titleFont: { size: 13 },
            bodyFont: { size: 12 },
            callbacks: {
              title: (items) => items[0]?.label || "",
              label: (item) => {
                const point = item.dataset.data?.[item.dataIndex];
                const completed = point?.completed === true;
                const missedStreak = Number(point?.missedStreak || 0);
                if (
                  window.location.hostname &&
                  ["localhost", "127.0.0.1"].includes(
                    window.location.hostname
                  ) &&
                  !window.__lfHabitTooltipMismatchLogged
                ) {
                  if (completed && item.parsed?.y < 0.5) {
                    window.__lfHabitTooltipMismatchLogged = true;
                    console.warn("Habit tooltip mismatch", point);
                  }
                }
                return formatDoneMissedTooltip(completed, missedStreak);
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#6e7681",
              maxTicksLimit: 6,
              autoSkip: true,
              font: { size: 12 },
            },
            grid: { color: "rgba(56, 66, 77, 0.2)" },
          },
          y: {
            min: 0,
            max: 1,
            ticks: { display: false, font: { size: 12 } },
            grid: { display: false },
          },
        },
      },
    });
  }
  async loadHabitDashboard(rangeDays = 30) {
    if (!this.app.user) return null;
    const range = getLocalRangeFromDays(rangeDays);
    const cacheKey = `${range.from}|${range.to}`;
    let data = this.app.statsCache.global.get(cacheKey);
    if (!data) {
      try {
        data = await this.app.api.getHabitsStats(range.from, range.to);
        this.app.statsCache.global.set(cacheKey, data);
      } catch (err) {
        console.error(err);
        data = { habits: [], logsByHabit: {} };
      }
    }
    return { range, ...data };
  }
  getDashboardFilters(state) {
    const filters = [];
    if (state.showForge) filters.push("FORGE");
    if (state.showPurge) filters.push("PURGE");
    return filters;
  }
  calculateConsistency(state) {
    const habits = this.app.habitManager?.habits || [];
    const filters = this.getDashboardFilters(state);
    const visibleHabits = habits.filter(
      (habit) =>
        filters.includes(habit.type) &&
        !habit?.archived &&
        !habit?.disabled &&
        !habit?.isArchived &&
        !habit?.isDisabled
    );
    if (visibleHabits.length === 0) return 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const getFirstActiveDate = (habit) => {
      const historyKeys = Object.keys(habit.history || {});
      if (historyKeys.length === 0) return null;
      let earliest = null;
      historyKeys.forEach((dateKey) => {
        const date = parseLocalDateKey(dateKey);
        if (!date) return;
        date.setHours(0, 0, 0, 0);
        if (!earliest || date < earliest) earliest = date;
      });
      return earliest;
    };
    let totalTracked = 0;
    let totalDone = 0;
    visibleHabits.forEach((habit) => {
      const startDate = getFirstActiveDate(habit);
      if (!startDate || startDate > today) return;
      const startDateKey = getLocalDateKey(startDate);
      let trackedHabit = 0;
      let doneHabit = 0;
      const cursor = new Date(startDate);
      while (cursor <= today) {
        const dateKey = getLocalDateKey(cursor);
        const hasRecord = Object.prototype.hasOwnProperty.call(
          habit.history || {},
          dateKey
        );
        totalTracked += 1;
        trackedHabit += 1;
        // Missing record counts as a missed day.
        if (hasRecord && habit.history?.[dateKey]) {
          totalDone += 1;
          doneHabit += 1;
        }
        cursor.setDate(cursor.getDate() + 1);
      }
      if (DEBUG_CONSISTENCY) {
        console.log("[Consistency Habit]", habit.name, {
          startDateKey,
          doneHabit,
          trackedHabit,
        });
      }
    });
    const pct = totalTracked ? Math.round((totalDone / totalTracked) * 100) : 0;
    if (DEBUG_CONSISTENCY) {
      if (totalTracked === 0) {
        console.warn("Consistency trackedAll is 0!");
      }
      console.log("[Consistency]", {
        doneAll: totalDone,
        trackedAll: totalTracked,
        pct,
      });
    }
    // Consistency is lifetime-based: missing records count as missed days.
    return pct;
  }
  calculateMomentum(state) {
    const habits = this.app.habitManager?.habits || [];
    const filters = this.getDashboardFilters(state);
    const visibleHabits = habits.filter(
      (habit) =>
        filters.includes(habit.type) &&
        !habit?.archived &&
        !habit?.disabled &&
        !habit?.isArchived &&
        !habit?.isDisabled
    );
    if (visibleHabits.length === 0) {
      return { momentum: 0, lastPct: 0, prevPct: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const computeWindowScore = (startOffsetDays, lengthDays) => {
      const endDate = new Date(today);
      endDate.setDate(endDate.getDate() - startOffsetDays);
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - (lengthDays - 1));

      let tracked = 0;
      let done = 0;

      visibleHabits.forEach((habit) => {
        const createdAt = habit?.createdAt ? new Date(habit.createdAt) : null;
        if (createdAt && !Number.isNaN(createdAt.getTime())) {
          createdAt.setHours(0, 0, 0, 0);
        }
        const effectiveStart =
          createdAt && createdAt > startDate ? createdAt : startDate;
        if (effectiveStart > endDate) return;
        const diff = Math.floor(
          (endDate - effectiveStart) / (24 * 60 * 60 * 1000)
        );
        tracked += diff + 1;

        Object.entries(habit.history || {}).forEach(([dateKey, isDone]) => {
          if (!isDone) return;
          const date = parseLocalDateKey(dateKey);
          if (!date) return;
          date.setHours(0, 0, 0, 0);
          if (date < effectiveStart || date > endDate) return;
          done += 1;
        });
      });

      return { done, tracked, score01: tracked ? done / tracked : 0 };
    };

    const last = computeWindowScore(0, 7);
    const prev = computeWindowScore(7, 7);
    const lastPct = Math.round(last.score01 * 100);
    const prevPct = Math.round(prev.score01 * 100);
    const momentumRaw = lastPct - prevPct;
    const momentum = Math.max(-100, Math.min(100, momentumRaw));
    // Momentum is week-over-week trend: last 7 days vs previous 7 days.
    return { momentum, lastPct, prevPct };
  }
  getActiveHabitsForLegend(state) {
    const habits = this.app.habitManager?.habits || [];
    const filters = this.getDashboardFilters(state);
    const visibleHabits = habits.filter((habit) =>
      filters.includes(habit.type)
    );
    const getCreatedAtTime = (habit) => {
      if (!habit?.createdAt) return null;
      const createdAt = new Date(habit.createdAt);
      const time = createdAt.getTime();
      return Number.isNaN(time) ? null : time;
    };
    const typeOrder = { FORGE: 0, PURGE: 1 };
    return [...visibleHabits].sort((a, b) => {
      const typeDelta = (typeOrder[a.type] ?? 99) - (typeOrder[b.type] ?? 99);
      if (typeDelta !== 0) return typeDelta;
      const aTime = getCreatedAtTime(a);
      const bTime = getCreatedAtTime(b);
      if (aTime !== null && bTime !== null) return aTime - bTime;
      if (aTime !== null) return -1;
      if (bTime !== null) return 1;
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
  }
  buildDashboardSeries(data, state) {
    if (!data) return { labels: [], datasets: [], hasData: false };
    const filters = this.getDashboardFilters(state);
    const habits = (data.habits || []).filter((habit) =>
      filters.includes(habit.type)
    );
    const rangeStart = data.range.from;
    const rangeEnd = data.range.to;
    if (!rangeStart || !rangeEnd) {
      return { labels: [], datasets: [], hasData: false };
    }
    const labels = buildLocalDateRangeKeys(rangeStart, rangeEnd);
    const baseAlpha = 0.65;
    const dailyTotals = new Array(labels.length).fill(0);
    const dailyCounts = new Array(labels.length).fill(0);
    const datasets = habits
      .map((habit) => {
        const logs = data.logsByHabit?.[habit.id] || [];
        const statusByDate = new Map();
        logs.forEach((log) =>
          statusByDate.set(normalizeLogDateKey(log.date), log.status)
        );
        const successValue = SUCCESS_STATUS[habit.type];
        const days = labels.map((dateKey) => ({
          date: dateKey,
          done: statusByDate.get(dateKey) === successValue,
        }));
        const normalized = computeNormalizedSeries(
          days,
          habit.type === "PURGE" ? "purge" : "forge"
        );
        normalized.values.forEach((value, index) => {
          dailyTotals[index] += value;
          dailyCounts[index] += 1;
        });
        return {
          label: habit.title,
          data: normalized.values.map((value, index) => ({
            x: labels[index],
            y: value * 100,
            completed: normalized.meta.completed[index],
            missedStreak: normalized.meta.missedStreaks[index],
          })),
          borderColor: hexToRgba(habit.color, baseAlpha),
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.25,
          fill: false,
          _baseColor: habit.color,
        };
      })
      .filter(Boolean);
    if (datasets.length > 0) {
      const dailyAverages = dailyTotals.map((total, index) =>
        dailyCounts[index] ? total / dailyCounts[index] : 0
      );
      const trendValues = rollingAverage(dailyAverages, 7).map(
        (value) => value * 100
      );
      datasets.push({
        label: "Overall 7-day trend",
        data: trendValues.map((value, index) => ({
          x: labels[index],
          y: value,
        })),
        borderColor: hexToRgba("#c9d1d9", 0.85),
        backgroundColor: hexToRgba("#c9d1d9", 0.08),
        borderWidth: 3,
        pointRadius: 0,
        tension: 0.25,
        fill: true,
        _isOverallTrend: true,
        _baseColor: "#c9d1d9",
      });
    }
    return { labels, datasets, hasData: datasets.length > 0 };
  }
  buildDashboardScoreboard(data, state) {
    if (!data) {
      return {
        rows: [],
        summary: {
          teamScore: 0,
          teamMomentum: 0,
          todayDone: 0,
          todayTotal: 0,
          forgeDone: 0,
          forgeTotal: 0,
          purgeDone: 0,
          purgeTotal: 0,
        },
        hasData: false,
      };
    }
    const filters = this.getDashboardFilters(state);
    const habits = (data.habits || []).filter((habit) =>
      filters.includes(habit.type)
    );
    const rangeStart = data.range.from;
    const rangeEnd = data.range.to;
    if (!rangeStart || !rangeEnd) {
      return {
        rows: [],
        summary: {
          teamScore: 0,
          teamMomentum: 0,
          todayDone: 0,
          todayTotal: 0,
          forgeDone: 0,
          forgeTotal: 0,
          purgeDone: 0,
          purgeTotal: 0,
        },
        hasData: false,
      };
    }
    const query = (this.dashboardScoreboardQuery || "").trim().toLowerCase();
    const sortBy = this.dashboardScoreboardSort || "score";
    const last7Keys = buildLocalDateRangeKeys(
      addLocalDays(rangeEnd, -6),
      rangeEnd
    );
    const prev7Keys = buildLocalDateRangeKeys(
      addLocalDays(rangeEnd, -13),
      addLocalDays(rangeEnd, -7)
    );
    const last30Keys = buildLocalDateRangeKeys(
      addLocalDays(rangeEnd, -29),
      rangeEnd
    );
    const todayKey = getLocalDateKey(new Date());

    const rows = [];
    let sumScore = 0;
    let sumLast7 = 0;
    let sumPrev7 = 0;
    let sumLast30 = 0;
    let count = 0;
    let todayDone = 0;
    let todayTotal = 0;
    let forgeDone = 0;
    let forgeTotal = 0;
    let purgeDone = 0;
    let purgeTotal = 0;

    const calcConsistency = (keys, statusByDate, successValue) => {
      if (!keys.length) return 0;
      const done = keys.reduce(
        (total, key) =>
          total + (statusByDate.get(key) === successValue ? 1 : 0),
        0
      );
      return Math.round((done / keys.length) * 100);
    };
    const buildHistoryFromLogs = (logs, successValue) => {
      const history = {};
      logs.forEach((log) => {
        const key = normalizeLogDateKey(log.date);
        history[key] = log.status === successValue;
      });
      return history;
    };
    habits.forEach((habit) => {
      const logs = data.logsByHabit?.[habit.id] || [];
      const statusByDate = new Map();
      logs.forEach((log) =>
        statusByDate.set(normalizeLogDateKey(log.date), log.status)
      );
      const successValue = SUCCESS_STATUS[habit.type];
      const last7 = calcConsistency(last7Keys, statusByDate, successValue);
      const prev7 = calcConsistency(prev7Keys, statusByDate, successValue);
      const last30 = calcConsistency(last30Keys, statusByDate, successValue);
      const streak = this.calculateStreak({
        ...habit,
        history: buildHistoryFromLogs(logs, successValue),
      });
      const streakFactor = (Math.min(streak, 14) / 14) * 100;
      const score = Math.round(
        last7 * 0.5 + last30 * 0.35 + streakFactor * 0.15
      );
      const momentumDelta = Math.round(last7 - prev7);
      const doneToday = statusByDate.get(todayKey) === successValue;
      const atRisk = !doneToday && streak > 0;

      if (query && !habit.title.toLowerCase().includes(query)) return;

      rows.push({
        id: habit.id,
        name: habit.title,
        type: habit.type,
        score: Math.max(0, Math.min(100, score)),
        last7,
        last30,
        streak,
        momentumDelta,
        atRisk,
      });

      sumScore += score;
      sumLast7 += last7;
      sumPrev7 += prev7;
      sumLast30 += last30;
      count += 1;

      todayTotal += 1;
      if (doneToday) todayDone += 1;
      if (habit.type === "FORGE") {
        forgeTotal += 1;
        if (doneToday) forgeDone += 1;
      } else if (habit.type === "PURGE") {
        purgeTotal += 1;
        if (doneToday) purgeDone += 1;
      }
    });

    rows.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "momentum") return b.momentumDelta - a.momentumDelta;
      if (sortBy === "streak") return b.streak - a.streak;
      return b.score - a.score;
    });

    const teamScore = count ? Math.round(sumScore / count) : 0;
    const teamLast7 = count ? Math.round(sumLast7 / count) : 0;
    const teamPrev7 = count ? Math.round(sumPrev7 / count) : 0;
    const teamMomentum = Math.round(teamLast7 - teamPrev7);

    return {
      rows,
      summary: {
        teamScore,
        teamMomentum,
        todayDone,
        todayTotal,
        forgeDone,
        forgeTotal,
        purgeDone,
        purgeTotal,
      },
      hasData: rows.length > 0,
    };
  }
  buildWeeklyProgress(daysCount, state) {
    const habits = this.app.habitManager?.habits || [];
    const filters = this.getDashboardFilters(state);
    const visibleHabits = habits.filter((habit) =>
      filters.includes(habit.type)
    );
    const getCreatedAtTime = (habit) => {
      if (!habit?.createdAt) return null;
      const createdAt = new Date(habit.createdAt);
      const time = createdAt.getTime();
      return Number.isNaN(time) ? null : time;
    };
    const sortedHabits = [...visibleHabits].sort((a, b) => {
      const aTime = getCreatedAtTime(a);
      const bTime = getCreatedAtTime(b);
      if (aTime !== null && bTime !== null) return aTime - bTime;
      if (aTime !== null) return -1;
      if (bTime !== null) return 1;
      return String(a?.id || "").localeCompare(String(b?.id || ""));
    });
    const endDate = new Date();
    endDate.setHours(0, 0, 0, 0);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - (daysCount - 1));
    const dayKeys = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      dayKeys.push(getLocalDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    const endKey = getLocalDateKey(endDate);
    const last7Keys = dayKeys.slice(-7);
    const prev7Keys = buildLocalDateRangeKeys(
      addLocalDays(endKey, -13),
      addLocalDays(endKey, -7)
    );

    const hasRecordForDay = (habit, dateKey) =>
      Object.prototype.hasOwnProperty.call(habit.history || {}, dateKey);
    const getDoneForDay = (habit, dateKey) =>
      Boolean((habit.history || {})[dateKey]);

    const activityForDay = (habit, dateKey) => {
      const hasRecord = hasRecordForDay(habit, dateKey);
      if (hasRecord)
        return { tracked: true, done: getDoneForDay(habit, dateKey) };
      return { tracked: true, done: false };
    };

    const getDayTotals = (dateKey) => {
      let total = 0;
      let done = 0;
      let forgeTotal = 0;
      let forgeDone = 0;
      let purgeTotal = 0;
      let purgeDone = 0;
      let dayHasRecord = false;
      let anyTracked = false;

      sortedHabits.forEach((habit) => {
        const activity = activityForDay(habit, dateKey);
        if (activity.tracked) {
          dayHasRecord = dayHasRecord || hasRecordForDay(habit, dateKey);
        }
        if (!activity.tracked) return;
        anyTracked = true;
        const isDone = activity.done;
        total += 1;
        if (habit.type === "FORGE") {
          forgeTotal += 1;
          if (isDone) forgeDone += 1;
        } else if (habit.type === "PURGE") {
          purgeTotal += 1;
          if (isDone) purgeDone += 1;
        }
        if (isDone) done += 1;
      });
      const na = !anyTracked && visibleHabits.length > 0 && !dayHasRecord;
      return {
        total,
        done,
        forgeTotal,
        forgeDone,
        purgeTotal,
        purgeDone,
        na,
      };
    };

    const calcPeriod = (keys) =>
      keys.reduce(
        (acc, key) => {
          const day = getDayTotals(key);
          acc.total += day.total;
          acc.done += day.done;
          return acc;
        },
        { total: 0, done: 0 }
      );

    // TEMP DEBUG: verify date keys vs history keys (remove after confirming)
    const sampleKeys = visibleHabits
      .slice(0, 2)
      .map((h) => Object.keys(h.history || {}).slice(0, 5));
    console.debug(
      "[weekly] dayKeys",
      dayKeys,
      "sample history keys",
      sampleKeys
    );

    const last7 = calcPeriod(last7Keys);
    const prev7 = calcPeriod(prev7Keys);
    const consistency = this.calculateConsistency(state);
    const momentumStats = this.calculateMomentum(state);
    const momentum = momentumStats.momentum;

    const buildSegmentsForDay = (dateKey) => {
      const forgeDoneSegments = [];
      const purgeDoneSegments = [];
      let forgeTrackedCount = 0;
      let purgeTrackedCount = 0;
      sortedHabits.forEach((habit) => {
        const activity = activityForDay(habit, dateKey);
        if (!activity.tracked) return;
        const isDone = activity.done === true;
        if (habit.type === "FORGE") {
          forgeTrackedCount += 1;
          if (isDone) {
            forgeDoneSegments.push({
              id: habit.id,
              name: habit.name,
              color: habit.color,
            });
          }
        } else if (habit.type === "PURGE") {
          purgeTrackedCount += 1;
          if (isDone) {
            purgeDoneSegments.push({
              id: habit.id,
              name: habit.name,
              color: habit.color,
            });
          }
        }
      });
      return {
        forgeDoneSegments,
        purgeDoneSegments,
        forgeMissedCount: Math.max(
          0,
          forgeTrackedCount - forgeDoneSegments.length
        ),
        purgeMissedCount: Math.max(
          0,
          purgeTrackedCount - purgeDoneSegments.length
        ),
      };
    };

    const days = dayKeys.map((dateKey) => {
      const day = getDayTotals(dateKey);
      const segments = buildSegmentsForDay(dateKey);
      const date = parseLocalDateKey(dateKey);
      const label = date
        ? date.toLocaleDateString("en-US", { weekday: "short" })
        : dateKey;
      if (DEBUG_WEEKLY) {
        const forgeTracked =
          segments.forgeDoneSegments.length + segments.forgeMissedCount;
        console.log(
          dateKey,
          "FORGE tracked =",
          forgeTracked,
          "done =",
          segments.forgeDoneSegments.length
        );
        if (label === "Mon") {
          console.debug(
            dateKey,
            "FORGE totals",
            day.forgeTotal,
            "FORGE done",
            day.forgeDone
          );
        }
      }
      return {
        dateKey,
        label,
        total: day.total,
        na: day.na,
        done: day.done,
        forgeDoneSegments: segments.forgeDoneSegments,
        purgeDoneSegments: segments.purgeDoneSegments,
        forgeMissedCount: segments.forgeMissedCount,
        purgeMissedCount: segments.purgeMissedCount,
        forgeTotal: day.forgeTotal,
        forgeDone: day.forgeDone,
        purgeTotal: day.purgeTotal,
        purgeDone: day.purgeDone,
      };
    });

    return {
      days,
      team7d: consistency,
      momentum,
    };
  }
  applyDashboardDatasetEmphasis(chart, hoverIndex, baseAlpha = 0.65) {
    chart.data.datasets.forEach((dataset, index) => {
      if (dataset._isOverallTrend || dataset._isTrend) return;
      const baseColor = dataset._baseColor || dataset.borderColor;
      const isActive = hoverIndex === null || hoverIndex === index;
      const alpha = hoverIndex === null ? baseAlpha : isActive ? 1 : 0.25;
      dataset.borderColor = hexToRgba(baseColor, alpha);
    });
    chart.update("none");
  }
  async renderHabitDashboardSmall() {
    const barsEl = document.getElementById("weekly-progress-bars");
    const teamEl = document.getElementById("weekly-team-consistency");
    const momentumEl = document.getElementById("weekly-team-momentum");
    const todayEl = document.getElementById("weekly-today-progress");
    const legendEl = document.querySelector(".weekly-legend");
    if (!barsEl) return;
    const state = this.dashboardModalState;
    const progress = this.buildWeeklyProgress(7, state);
    if (legendEl) {
      const habitsForLegend = this.getActiveHabitsForLegend(state);
      const maxLegendItems = 4;
      legendEl.innerHTML = "";
      habitsForLegend.slice(0, maxLegendItems).forEach((habit) => {
        const item = document.createElement("div");
        item.className = "legend-item";
        item.title = habit.name;
        const dot = document.createElement("span");
        dot.className = "legend-dot";
        dot.style.backgroundColor = habit.color;
        const label = document.createElement("span");
        label.className = "legend-label";
        label.textContent = habit.name;
        item.appendChild(dot);
        item.appendChild(label);
        legendEl.appendChild(item);
      });
      if (habitsForLegend.length > maxLegendItems) {
        const more = document.createElement("span");
        more.className = "legend-more";
        more.textContent = `+${habitsForLegend.length - maxLegendItems}`;
        legendEl.appendChild(more);
      }
    }
    const buildSegmentsContainer = (doneSegments, missedCount) => {
      const container = document.createElement("div");
      container.className = "segments";
      (doneSegments || []).forEach((segment) => {
        const segmentEl = document.createElement("span");
        segmentEl.classList.add("segment", "is-done");
        if (segment.color) {
          segmentEl.style.backgroundColor = segment.color;
        }
        container.appendChild(segmentEl);
      });
      for (let i = 0; i < (missedCount || 0); i += 1) {
        const segmentEl = document.createElement("span");
        segmentEl.classList.add("segment", "is-empty");
        container.appendChild(segmentEl);
      }
      return container;
    };
    const dayStats = progress.days.map((day) => ({
      ...day,
      forgePercent: day.forgeTotal
        ? Math.round((day.forgeDone / day.forgeTotal) * 100)
        : 0,
      purgePercent: day.purgeTotal
        ? Math.round((day.purgeDone / day.purgeTotal) * 100)
        : 0,
    }));
    const todayIndex = Math.max(0, dayStats.length - 1);
    barsEl.style.setProperty("--bar-count", String(progress.days.length));
    barsEl.innerHTML = "";
    dayStats.forEach((day, index) => {
      const dayCol = document.createElement("div");
      dayCol.className = "day-col";
      if (day.na) dayCol.classList.add("is-na");
      if (index === todayIndex) dayCol.classList.add("is-today");
      if (index === todayIndex) {
        const todayAccent =
          day.forgeDone > 0 && day.purgeDone === 0
            ? "var(--forge-accent-rgb)"
            : day.purgeDone > 0 && day.forgeDone === 0
            ? "var(--purge-accent-rgb)"
            : "var(--forge-accent-rgb)";
        dayCol.style.setProperty("--today-accent-rgb", todayAccent);
      }
      const tooltip = day.na
        ? `${day.label}: Not tracked yet`
        : `${day.label}: Forge ${day.forgeDone}/${day.forgeTotal} (${day.forgePercent}%), Purge ${day.purgeDone}/${day.purgeTotal} (${day.purgePercent}%), Total ${day.done}/${day.total}`;
      dayCol.setAttribute("data-tooltip", tooltip);
      dayCol.setAttribute("aria-label", tooltip);

      const bars = document.createElement("div");
      bars.className = "day-bars";

      if (day.na) {
        const naBar = document.createElement("div");
        naBar.className = "week-bar week-bar--na";
        bars.appendChild(naBar);
      } else {
        const forgeBar = document.createElement("div");
        forgeBar.className = `mini-bar forge${
          day.forgeTotal ? "" : " is-empty"
        }`;
        forgeBar.appendChild(
          buildSegmentsContainer(day.forgeDoneSegments, day.forgeMissedCount)
        );
        const purgeBar = document.createElement("div");
        purgeBar.className = `mini-bar purge${
          day.purgeTotal ? "" : " is-empty"
        }`;
        purgeBar.appendChild(
          buildSegmentsContainer(day.purgeDoneSegments, day.purgeMissedCount)
        );

        bars.appendChild(forgeBar);
        bars.appendChild(purgeBar);

        if (DEBUG_WEEKLY) {
          const forgeRendered = forgeBar.querySelectorAll(".segment").length;
          const purgeRendered = purgeBar.querySelectorAll(".segment").length;
          const forgeExpected =
            day.forgeDoneSegments.length + day.forgeMissedCount;
          const purgeExpected =
            day.purgeDoneSegments.length + day.purgeMissedCount;
          if (forgeRendered !== forgeExpected) {
            console.warn(
              `[weekly-bars] ${day.dateKey} forge segments expected ${forgeExpected} rendered ${forgeRendered}`
            );
          }
          if (purgeRendered !== purgeExpected) {
            console.warn(
              `[weekly-bars] ${day.dateKey} purge segments expected ${purgeExpected} rendered ${purgeRendered}`
            );
          }
        }
      }

      const label = document.createElement("span");
      label.className = "day-label";
      label.textContent = day.label;

      dayCol.appendChild(bars);
      dayCol.appendChild(label);
      barsEl.appendChild(dayCol);
    });
    if (todayEl) {
      const today = dayStats[todayIndex];
      todayEl.textContent = `Today: ${today?.done || 0}/${
        today?.total || 0
      } done`;
    }
    if (teamEl) {
      const teamLabel = teamEl
        .closest(".weekly-kpi")
        ?.querySelector(".kpi-label");
      if (teamLabel) teamLabel.textContent = "Consistency";
      teamEl.textContent = `${progress.team7d}%`;
    }
    if (momentumEl) {
      const delta = progress.momentum;
      const arrow = delta > 0 ? "&#9650;" : delta < 0 ? "&#9660;" : "&#8594;";
      const sign = delta > 0 ? "+" : delta < 0 ? "-" : "";
      momentumEl.innerHTML = `${arrow} ${sign}${Math.abs(delta)}%`;
      momentumEl.classList.remove("is-up", "is-down", "is-flat");
      momentumEl.classList.add(
        delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat"
      );
    }
    this.dashboardChartSmall = null;
  }
  async renderHabitDashboardLarge() {
    const listEl = document.getElementById("habits-scoreboard-list");
    const emptyEl = document.getElementById("habits-scoreboard-empty");
    const tableEl = document.querySelector(".scoreboard-table");
    const modalEl = document.getElementById("habits-dashboard-modal");
    if (!listEl) return;
    const data = await this.loadHabitDashboard(
      this.dashboardModalState.rangeDays
    );
    if (!data) return;
    const scoreboard = this.buildDashboardScoreboard(
      data,
      this.dashboardModalState
    );
    if (this.dashboardChartLarge) {
      this.dashboardChartLarge.destroy();
      this.dashboardChartLarge = null;
    }
    if (!scoreboard.hasData) {
      if (emptyEl) emptyEl.classList.remove("hidden");
      if (tableEl) tableEl.classList.add("hidden");
      listEl.innerHTML = "";
      const teamScoreEl = document.getElementById("scoreboard-team-score");
      const teamMomentumEl = document.getElementById(
        "scoreboard-team-momentum"
      );
      const todayProgressEl = document.getElementById(
        "scoreboard-today-progress"
      );
      const todayBreakdownEl = document.getElementById(
        "scoreboard-today-breakdown"
      );
      if (teamScoreEl) teamScoreEl.textContent = "0";
      if (teamMomentumEl) {
        teamMomentumEl.classList.remove("is-up", "is-down", "is-flat");
        teamMomentumEl.classList.add("scoreboard-momentum", "is-flat");
        teamMomentumEl.innerHTML = "&#8594; 0%";
      }
      if (todayProgressEl) todayProgressEl.textContent = "0/0";
      if (todayBreakdownEl) {
        todayBreakdownEl.textContent = "Forge 0/0 | Purge 0/0";
      }
      this.refreshModalScroll(modalEl);
      return;
    }
    if (emptyEl) emptyEl.classList.add("hidden");
    if (tableEl) tableEl.classList.remove("hidden");

    const teamScoreEl = document.getElementById("scoreboard-team-score");
    const teamMomentumEl = document.getElementById("scoreboard-team-momentum");
    const todayProgressEl = document.getElementById(
      "scoreboard-today-progress"
    );
    const todayBreakdownEl = document.getElementById(
      "scoreboard-today-breakdown"
    );
    if (teamScoreEl) {
      teamScoreEl.textContent = `${scoreboard.summary.teamScore}`;
    }
    if (teamMomentumEl) {
      const delta = scoreboard.summary.teamMomentum;
      const arrow = delta > 1 ? "&#9650;" : delta < -1 ? "&#9660;" : "&#8594;";
      const momentumClass =
        delta > 1 ? "is-up" : delta < -1 ? "is-down" : "is-flat";
      teamMomentumEl.classList.remove("is-up", "is-down", "is-flat");
      teamMomentumEl.classList.add("scoreboard-momentum", momentumClass);
      teamMomentumEl.innerHTML =
        delta === 100 ? "PEAK" : `${arrow} ${Math.abs(delta)}%`;
    }
    if (todayProgressEl) {
      todayProgressEl.textContent = `${scoreboard.summary.todayDone}/${scoreboard.summary.todayTotal}`;
    }
    if (todayBreakdownEl) {
      todayBreakdownEl.textContent = `Forge ${scoreboard.summary.forgeDone}/${scoreboard.summary.forgeTotal} | Purge ${scoreboard.summary.purgeDone}/${scoreboard.summary.purgeTotal}`;
    }

    listEl.innerHTML = "";
    scoreboard.rows.forEach((row) => {
      const isPeak = row.last7 === 100 || row.momentumDelta === 100;
      const momentumClass = isPeak
        ? "is-up"
        : row.momentumDelta > 1
        ? "is-up"
        : row.momentumDelta < -1
        ? "is-down"
        : "is-flat";
      const momentumArrow =
        row.momentumDelta > 1
          ? "&#9650;"
          : row.momentumDelta < -1
          ? "&#9660;"
          : "&#8594;";
      const momentumDisplay = isPeak
        ? "PEAK"
        : `${momentumArrow} ${Math.abs(row.momentumDelta)}%`;
      const typeLabel = row.type === "PURGE" ? "Purge" : "Forge";
      const typeClass = row.type === "PURGE" ? "purge" : "forge";
      const riskIcon = row.atRisk ? "&#9888;" : "&mdash;";
      const rowEl = document.createElement("button");
      rowEl.type = "button";
      rowEl.className = "scoreboard-row scoreboard-item";
      rowEl.innerHTML = `
        <span class="scoreboard-habit">
          <span class="habit-name">${row.name}</span>
          <span class="habit-badge ${typeClass}">${typeLabel}</span>
        </span>
        <span>${row.score}</span>
        <span>${row.last7}%</span>
        <span>${row.last30}%</span>
        <span>${row.streak}</span>
        <span class="scoreboard-momentum ${momentumClass}">${momentumDisplay}</span>
        <span class="scoreboard-risk">${riskIcon}</span>
      `;
      rowEl.addEventListener("click", () => this.openHabitStatsModal(row.id));
      listEl.appendChild(rowEl);
    });
    this.refreshModalScroll(modalEl);
  }
  updateDashboardPreviewOverlay(series, state) {
    const startEl = document.getElementById("dashboard-date-start");
    const midEl = document.getElementById("dashboard-date-mid");
    const endEl = document.getElementById("dashboard-date-end");
    const legendEl = document.getElementById("dashboard-legend");
    const labels = series.labels || [];
    const formatLabel = (label) => {
      const date = parseLocalDateKey(label);
      if (!date) return label || "--";
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    };
    const start = labels[0];
    const end = labels[labels.length - 1];
    const mid =
      labels.length > 2 ? labels[Math.floor(labels.length / 2)] : null;
    if (startEl) startEl.textContent = start ? formatLabel(start) : "--";
    if (midEl) midEl.textContent = mid ? formatLabel(mid) : "";
    if (endEl) endEl.textContent = end ? formatLabel(end) : "--";
    if (legendEl) {
      legendEl.innerHTML = "";
      const legendDatasets = (series.datasets || []).filter(
        (dataset) => !dataset._isOverallTrend
      );
      legendDatasets.forEach((dataset) => {
        const item = document.createElement("div");
        item.className = "chart-legend-item";
        const dot = document.createElement("span");
        dot.className = "chart-legend-dot";
        dot.style.setProperty(
          "--legend-color",
          dataset._baseColor || dataset.borderColor
        );
        const name = document.createElement("span");
        name.textContent = dataset.label;
        item.appendChild(dot);
        item.appendChild(name);
        legendEl.appendChild(item);
      });
    }
  }
  openHabitModal(h) {
    this.activeHabit = h;
    this.modalDate = new Date();
    const m = document.getElementById("habit-modal");
    m.style.display = "flex";
    this.updateModalLock();
    m.style.setProperty("--habit-color", h.color);
    document.getElementById("modal-habit-name").innerText = h.name;
    this.renderModalCalendar();
    requestAnimationFrame(() => this.refreshModalScroll(m));
  }
  closeModal() {
    document.getElementById("habit-modal").style.display = "none";
    this.updateModalLock();
  }
  changeMonth(d) {
    this.modalDate.setMonth(this.modalDate.getMonth() + d);
    this.renderModalCalendar();
  }
  getStreakGoalConfig(habit) {
    const schedule =
      habit?.schedule && typeof habit.schedule === "object"
        ? habit.schedule
        : {};
    const rawType = String(schedule.streakGoalType || "DAILY").toUpperCase();
    const type = ["DAILY", "WEEKLY", "MONTHLY"].includes(rawType)
      ? rawType
      : "DAILY";
    let count = Number.parseInt(schedule.streakGoalCount, 10);
    if (!Number.isFinite(count) || count < 1) count = 1;
    if (type === "WEEKLY") count = Math.min(7, count);
    return { type, count };
  }
  getWeekStartLocal(date) {
    if (this.app?.habitManager?.getWeekStart) {
      return this.app.habitManager.getWeekStart(date);
    }
    const d = new Date(date);
    const dayIndex = (d.getDay() + 6) % 7;
    d.setDate(d.getDate() - dayIndex);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  getMonthStartLocal(date) {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }
  getMonthEndLocal(date) {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0);
  }
  addDaysToDate(date, delta) {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    return d;
  }
  addMonthsToDate(date, delta) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
  }
  getHistoryStartDate(habit) {
    const keys = Object.keys(habit.history || {});
    if (!keys.length) return null;
    let earliest = null;
    keys.forEach((key) => {
      const date = parseLocalDateKey(key);
      if (!date) return;
      if (!earliest || date < earliest) earliest = date;
    });
    if (earliest) earliest.setHours(0, 0, 0, 0);
    return earliest;
  }
  countDoneInRange(habit, startDate, endDate) {
    const startKey = getLocalDateKey(startDate);
    const endKey = getLocalDateKey(endDate);
    const keys = buildLocalDateRangeKeys(startKey, endKey);
    let done = 0;
    keys.forEach((key) => {
      if (habit.history?.[key]) done += 1;
    });
    return done;
  }
  getIntervalBounds(type, date) {
    if (type === "WEEKLY") {
      const start = this.getWeekStartLocal(date);
      const end = this.addDaysToDate(start, 6);
      return { start, end, label: "this week" };
    }
    if (type === "MONTHLY") {
      const start = this.getMonthStartLocal(date);
      const end = this.getMonthEndLocal(date);
      return { start, end, label: "this month" };
    }
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return { start, end: start, label: "today" };
  }
  getRequiredCountForInterval(type, date, count) {
    if (type === "WEEKLY") return Math.max(1, Math.min(7, count));
    if (type === "MONTHLY") {
      const days = this.getMonthEndLocal(date).getDate();
      return Math.max(1, Math.min(days, count));
    }
    return 1;
  }
  calculateDailyStreak(habit) {
    let streak = 0;
    let cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    while (true) {
      const key = getLocalDateKey(cursor);
      if (habit.history?.[key]) {
        streak += 1;
        cursor = this.addDaysToDate(cursor, -1);
        continue;
      }
      if (streak === 0) {
        cursor = this.addDaysToDate(cursor, -1);
        const prevKey = getLocalDateKey(cursor);
        if (habit.history?.[prevKey]) continue;
      }
      break;
    }
    return streak;
  }
  calculateBestDailyStreak(habit, startDate, endDate) {
    let best = 0;
    let run = 0;
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const key = getLocalDateKey(cursor);
      if (habit.history?.[key]) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return best;
  }
  getWeeklyStreaks(habit, required, historyStart, currentWeekStart) {
    let current = 0;
    let best = 0;
    if (!historyStart) return { current, best };
    const lastClosedWeekStart = this.addDaysToDate(currentWeekStart, -7);
    let cursor = new Date(lastClosedWeekStart);
    while (cursor >= historyStart) {
      const end = this.addDaysToDate(cursor, 6);
      const done = this.countDoneInRange(habit, cursor, end);
      if (done >= required) {
        current += 1;
        cursor = this.addDaysToDate(cursor, -7);
      } else {
        break;
      }
    }
    let run = 0;
    let iter = this.getWeekStartLocal(historyStart);
    const endLimit = this.addDaysToDate(currentWeekStart, -1);
    while (iter <= endLimit) {
      const end = this.addDaysToDate(iter, 6);
      const done = this.countDoneInRange(habit, iter, end);
      if (done >= required) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
      iter = this.addDaysToDate(iter, 7);
    }
    return { current, best };
  }
  getMonthlyStreaks(habit, required, historyStart, currentMonthStart) {
    let current = 0;
    let best = 0;
    if (!historyStart) return { current, best };
    let cursor = this.addMonthsToDate(currentMonthStart, -1);
    while (cursor >= historyStart) {
      const end = this.getMonthEndLocal(cursor);
      const needed = this.getRequiredCountForInterval(
        "MONTHLY",
        cursor,
        required
      );
      const done = this.countDoneInRange(habit, cursor, end);
      if (done >= needed) {
        current += 1;
        cursor = this.addMonthsToDate(cursor, -1);
      } else {
        break;
      }
    }
    let run = 0;
    let iter = this.getMonthStartLocal(historyStart);
    const endLimit = this.addMonthsToDate(currentMonthStart, -1);
    while (iter <= endLimit) {
      const end = this.getMonthEndLocal(iter);
      const needed = this.getRequiredCountForInterval(
        "MONTHLY",
        iter,
        required
      );
      const done = this.countDoneInRange(habit, iter, end);
      if (done >= needed) {
        run += 1;
        if (run > best) best = run;
      } else {
        run = 0;
      }
      iter = this.addMonthsToDate(iter, 1);
    }
    return { current, best };
  }
  getStreakSummary(habit) {
    const { type, count } = this.getStreakGoalConfig(habit);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const historyStart = this.getHistoryStartDate(habit);
    const interval = this.getIntervalBounds(type, today);
    const required = this.getRequiredCountForInterval(
      type,
      interval.start,
      count
    );
    const intervalDone = this.countDoneInRange(
      habit,
      interval.start,
      interval.end
    );
    let currentStreak = 0;
    let bestStreak = 0;
    if (historyStart) {
      if (type === "DAILY") {
        currentStreak = this.calculateDailyStreak(habit);
        bestStreak = this.calculateBestDailyStreak(habit, historyStart, today);
      } else if (type === "WEEKLY") {
        const currentWeekStart = this.getWeekStartLocal(today);
        const streaks = this.getWeeklyStreaks(
          habit,
          required,
          historyStart,
          currentWeekStart
        );
        currentStreak = streaks.current;
        bestStreak = streaks.best;
      } else {
        const currentMonthStart = this.getMonthStartLocal(today);
        const streaks = this.getMonthlyStreaks(
          habit,
          count,
          historyStart,
          currentMonthStart
        );
        currentStreak = streaks.current;
        bestStreak = streaks.best;
      }
    }
    const nextResetDate =
      type === "DAILY" ? this.addDaysToDate(today, 1) : interval.end;
    return {
      type,
      required,
      intervalDone,
      intervalLabel: interval.label,
      nextResetDate,
      currentStreak,
      bestStreak,
    };
  }
  calculateStreak(habit) {
    return this.getStreakSummary(habit).currentStreak;
  }
  renderModalCalendar() {
    const h = this.activeHabit;
    const y = this.modalDate.getFullYear();
    const m = this.modalDate.getMonth();
    const heatmap = this.app.habitManager.buildHeatmap(
      h.history,
      26,
      h.createdAt
    );
    const modalContent = document.querySelector(".habit-modal");
    if (modalContent) modalContent.style.setProperty("--weeks", heatmap.weeks);
    const heatmapMonths = document.getElementById("modal-heatmap-months");
    const heatmapGrid = document.getElementById("modal-heatmap-grid");
    const debugEl = document.getElementById("modal-log-debug");
    if (heatmapMonths) heatmapMonths.innerHTML = heatmap.months;
    if (heatmapGrid) heatmapGrid.innerHTML = heatmap.boxes;
    if (debugEl) {
      if (DEBUG_LOGS) {
        const logCount = Object.keys(h.history || {}).length;
        debugEl.textContent = `Loaded logs: ${logCount}`;
        debugEl.classList.remove("hidden");
      } else {
        debugEl.classList.add("hidden");
      }
    }
    document.getElementById("modal-month-title").innerText =
      this.modalDate.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });
    const grid = document.getElementById("modal-calendar-grid");
    grid.innerHTML = "";
    const start = (new Date(y, m, 1).getDay() || 7) - 1;
    for (let i = 0; i < start; i++)
      grid.innerHTML += `<div class="modal-day empty"></div>`;
    for (let day = 1; day <= new Date(y, m + 1, 0).getDate(); day++) {
      const k = getLocalDateKey(new Date(y, m, day));
      const dayEl = document.createElement("div");
      const dayDate = new Date(y, m, day);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dayDate.setHours(0, 0, 0, 0);
      const isFuture = dayDate > today;
      dayEl.className = `modal-day ${h.history[k] ? "active" : ""} ${
        isFuture ? "disabled" : ""
      }`;
      dayEl.innerHTML = `<span>${day}</span>`;
      if (!isFuture) {
        dayEl.onclick = () => {
          console.debug("modal-day-click", { habitId: h.id, dateKey: k });
          this.app.habitManager.toggleDayStatus(h.id, k);
        };
      }
      grid.appendChild(dayEl);
    }
    this.refreshModalScroll(document.getElementById("habit-modal"));
  }
}

class LifeForge {
  constructor() {
    this.api = new ApiClient();
    this.user = null;
    this.player = new Player();
    this.statsCache = {
      habit: new Map(),
      global: new Map(),
    };
    this.ui = new UI(this);
    this.habitManager = new HabitManager(this, []);
    this.todoManager = new TodoManager(this, []);
    this.focusManager = new FocusManager(this, []);
    this.init();
  }
  async init() {
    await this.refreshSession();
    this.ui.initNavigation();
    this.ui.initColorSelector();
    this.ui.initTodoColorSelector();
    this.ui.initXpDisplay();
    this.ui.initCustomSelects();
    this.ui.initRankModal();
    this.ui.initStatsModal();
    this.ui.initTreasuryModal();
    this.ui.initHabitModal();
    this.ui.initHabitStatsModal();
    this.ui.initHabitDashboard();
    this.ui.initModalEscapeClose();
    this.ui.initModalScroll();
    this.ui.initCardSystemV2();
    this.ui.updateStats();
    this.ui.updateDailyQuote();
    this.bindAuth();
    const streakTypeEl = document.getElementById("habit-streak-type");
    const streakCountWrap = document.getElementById("habit-streak-count-wrap");
    const streakCountInput = document.getElementById("habit-streak-count");
    const streakLabel = document.getElementById("habit-streak-count-label");
    const habitNameInput = document.getElementById("habit-name");
    const habitTypeSelect = document.getElementById("habit-type");
    const habitDifficultySelect = document.getElementById("habit-difficulty");
    const habitColorInput = document.getElementById("habit-color");
    const addHabitButton = document.getElementById("add-habit-btn");
    const getDaysInCurrentMonth = () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    };
    const updateHabitCreateState = () => {
      if (!addHabitButton) return;
      const nameOk = Boolean(habitNameInput?.value.trim());
      const typeOk =
        habitTypeSelect && ["FORGE", "PURGE"].includes(habitTypeSelect.value);
      const difficultyOk =
        habitDifficultySelect &&
        ["1", "2", "3"].includes(habitDifficultySelect.value);
      const colorOk = Boolean(habitColorInput?.value.trim());
      const streakTypeValue = streakTypeEl?.value || "";
      const streakTypeOk = ["DAILY", "WEEKLY", "MONTHLY"].includes(
        streakTypeValue
      );
      let countOk = true;
      if (streakTypeValue === "WEEKLY" || streakTypeValue === "MONTHLY") {
        const raw = Number.parseInt(streakCountInput?.value, 10);
        const max = streakTypeValue === "WEEKLY" ? 7 : getDaysInCurrentMonth();
        countOk = Number.isFinite(raw) && raw >= 1 && raw <= max;
      }
      addHabitButton.disabled = !(
        nameOk &&
        typeOk &&
        difficultyOk &&
        colorOk &&
        streakTypeOk &&
        countOk
      );
    };
    const updateStreakGoalControls = () => {
      if (!streakTypeEl || !streakCountWrap || !streakCountInput) return;
      const type = streakTypeEl.value;
      if (!["DAILY", "WEEKLY", "MONTHLY"].includes(type)) {
        streakCountWrap.classList.add("hidden");
        return;
      }
      if (type === "DAILY") {
        streakCountWrap.classList.add("hidden");
        streakCountInput.value = "1";
        return;
      }
      streakCountWrap.classList.remove("hidden");
      if (type === "WEEKLY") {
        streakCountInput.min = "1";
        streakCountInput.max = "7";
        if (streakLabel) streakLabel.textContent = "Completions per week";
        if (Number(streakCountInput.value) > 7) {
          streakCountInput.value = "7";
        }
      } else {
        const max = getDaysInCurrentMonth();
        streakCountInput.min = "1";
        streakCountInput.max = String(max);
        if (streakLabel) streakLabel.textContent = "Completions per month";
        if (Number(streakCountInput.value) > max) {
          streakCountInput.value = String(max);
        }
      }
    };
    if (streakTypeEl) {
      streakTypeEl.addEventListener("change", () => {
        updateStreakGoalControls();
        updateHabitCreateState();
      });
      updateStreakGoalControls();
    }
    if (streakCountInput) {
      streakCountInput.addEventListener("input", updateHabitCreateState);
    }
    if (habitNameInput) {
      habitNameInput.addEventListener("input", updateHabitCreateState);
    }
    if (habitTypeSelect) {
      habitTypeSelect.addEventListener("change", updateHabitCreateState);
    }
    if (habitDifficultySelect) {
      habitDifficultySelect.addEventListener("change", updateHabitCreateState);
    }
    document.querySelectorAll(".habit-color-dot").forEach((dot) => {
      dot.addEventListener("click", updateHabitCreateState);
    });
    updateHabitCreateState();
    document.getElementById("add-habit-btn").onclick = async () => {
      const n = document.getElementById("habit-name").value.trim();
      const difficulty = document.getElementById("habit-difficulty").value;
      if (n) {
        const streakType = streakTypeEl?.value || "";
        let streakCount = Number.parseInt(streakCountInput?.value, 10);
        if (!Number.isFinite(streakCount) || streakCount < 1) streakCount = 1;
        if (streakType === "DAILY") streakCount = 1;
        if (streakType === "WEEKLY") {
          streakCount = Math.max(1, Math.min(7, streakCount));
        } else if (streakType === "MONTHLY") {
          const max = getDaysInCurrentMonth();
          streakCount = Math.max(1, Math.min(max, streakCount));
        }
        if (!["DAILY", "WEEKLY", "MONTHLY"].includes(streakType)) return;
        const schedule = {
          streakGoalType: streakType,
          streakGoalCount: streakCount,
        };
        await this.habitManager.addHabit(
          n,
          document.getElementById("habit-type").value,
          difficulty,
          document.getElementById("habit-color").value,
          schedule
        );
        document.getElementById("habit-name").value = "";
        if (streakTypeEl) {
          streakTypeEl.value = "";
          streakTypeEl.dispatchEvent(new Event("change"));
        }
        updateStreakGoalControls();
        updateHabitCreateState();
      }
    };
    document.getElementById("add-todo-btn").onclick = async () => {
      const title = document.getElementById("todo-title").value.trim();
      const description = document.getElementById("todo-desc").value.trim();
      const priority = document.getElementById("todo-priority").value;
      const isDaily = document.getElementById("todo-daily").checked;
      const dueDate = document.getElementById("todo-due").value;
      if (!title) return;
      await this.todoManager.addTodo(
        title,
        description || null,
        priority,
        isDaily,
        dueDate || null
      );
      document.getElementById("todo-title").value = "";
      document.getElementById("todo-desc").value = "";
      document.getElementById("todo-daily").checked = false;
      document.getElementById("todo-due").value = "";
    };
  }
  async refreshSession() {
    try {
      const me = await this.api.me();
      this.user = me.user;
      this.ui.setAuthLocked(!this.user);
      if (this.user) {
        try {
          await this.refreshProfileFromApi();
        } catch (err) {
          console.error("Failed to refresh profile data:", err);
        }
      }
    } catch (_err) {
      this.user = null;
      this.ui.setAuthLocked(true);
      this.player.applyProgress(
        { xpTotal: 0, level: 1, forgeCoins: 0, rank: "Ember" },
        null
      );
      this.habitManager.setHabitsFromData([]);
      this.habitManager.init();
      this.todoManager.setTodosFromData([]);
      this.todoManager.init();
      this.focusManager.setSessionsFromData([]);
      this.focusManager.todayStats = null;
      this.focusManager.updateStatus("Sign in to start focus.");
      this.ui.refreshHabitDashboardIfVisible();
    }
  }
  async refreshProfileFromApi() {
    if (!this.user) return;
    const results = await Promise.allSettled([
      this.api.getProgress(),
      this.api.getHabits(),
      this.api.getTodos(),
      this.api.getFocusToday(),
    ]);
    const [progressRes, habitsRes, todosRes, focusRes] = results;
    const progress =
      progressRes.status === "fulfilled"
        ? progressRes.value
        : { progress: null };
    const habits =
      habitsRes.status === "fulfilled" ? habitsRes.value : { habits: [] };
    const todos =
      todosRes.status === "fulfilled" ? todosRes.value : { todos: [] };
    const focusToday = focusRes.status === "fulfilled" ? focusRes.value : null;
    this.player.applyProgress(progress.progress, this.user);
    this.habitManager.setHabitsFromData(habits.habits || []);
    await this.habitManager.loadLogsForVisibleRange();
    this.habitManager.init();
    this.todoManager.setTodosFromData(todos.todos || []);
    this.todoManager.init();
    this.focusManager.todayStats = focusToday;
    this.focusManager.setSessionsFromData(focusToday?.todaySessions || []);
    this.habitManager.renderDailyQuests();
    this.ui.updateStats();
    this.ui.refreshHabitDashboardIfVisible();
  }
  bindAuth() {
    const email = document.getElementById("auth-email");
    const password = document.getElementById("auth-password");
    const name = document.getElementById("auth-name");
    const loginBtn = document.getElementById("auth-login");
    const registerBtn = document.getElementById("auth-register");
    const modeRegisterBtn = document.getElementById("auth-mode-register");
    const modeLoginBtn = document.getElementById("auth-mode-login");
    const logoutBtn = document.getElementById("auth-logout");
    const dashboardLogoutBtn = document.getElementById("dashboard-logout");
    const dashboardUserName = document.getElementById("dashboard-user-name");
    const authStatus = document.getElementById("auth-status");
    const authForms = document.getElementById("auth-forms");
    const authUser = document.getElementById("auth-user");
    const authUserName = document.getElementById("auth-user-name");
    const googleLink = document.getElementById("auth-google");

    const setStatus = (text) => {
      if (authStatus) authStatus.textContent = text;
    };
    const updateAuthUI = () => {
      if (!authForms || !authUser) return;
      if (this.user) {
        authForms.classList.add("hidden");
        authUser.classList.remove("hidden");
        authUserName.textContent = this.user.name || this.user.email || "User";
        setStatus(`Signed in as ${this.user.email || this.user.name || "User"}`);
      } else {
        authForms.classList.remove("hidden");
        authUser.classList.add("hidden");
        setStatus("Not signed in");
      }
      this.ui.setAuthLocked(!this.user);
    };
    const updateDashboardAccount = () => {
      if (dashboardUserName) {
        dashboardUserName.textContent =
          this.user?.name || this.user?.email || "Signed in";
      }
      if (dashboardLogoutBtn) {
        dashboardLogoutBtn.disabled = !this.user;
      }
    };
    const setMode = (nextMode) => {
      const isRegister = nextMode === "register";
      if (modeRegisterBtn)
        modeRegisterBtn.classList.toggle("active", isRegister);
      if (modeLoginBtn) modeLoginBtn.classList.toggle("active", !isRegister);
      if (name) name.classList.toggle("hidden", !isRegister);
      if (registerBtn) registerBtn.classList.toggle("hidden", !isRegister);
      if (loginBtn) loginBtn.classList.toggle("hidden", isRegister);
    };
    if (googleLink) {
      googleLink.href = `${API_BASE}/api/auth/google`;
    }
    if (modeRegisterBtn) modeRegisterBtn.onclick = () => setMode("register");
    if (modeLoginBtn) modeLoginBtn.onclick = () => setMode("login");
    setMode("register");
    updateAuthUI();
    updateDashboardAccount();

    if (loginBtn) {
      loginBtn.onclick = async () => {
        try {
          setStatus("Signing in...");
          const data = await this.api.login({
            email: email.value.trim(),
            password: password.value,
          });
          if (data?.token) localStorage.setItem("lf_token", data.token);

          await this.refreshSession();
          updateAuthUI();
          updateDashboardAccount();
        } catch (err) {
          setStatus(`Sign in failed: ${err.message || "Login failed"}`);
        }
      };
    }
    if (registerBtn) {
      registerBtn.onclick = async () => {
        try {
          const nickname = name.value.trim();
          if (!nickname) {
            setStatus("Nickname is required");
            return;
          }
          const data = await this.api.register({
            email: email.value.trim(),
            password: password.value,
            name: nickname,
          });
          if (data?.token) localStorage.setItem("lf_token", data.token);

          await this.refreshSession();
          updateAuthUI();
          updateDashboardAccount();
        } catch (err) {
          setStatus(err.message || "Register failed");
        }
      };
    }
    if (logoutBtn) {
      logoutBtn.onclick = async () => {
        try {
          await this.api.logout();
          localStorage.removeItem("lf_token");
        } catch (_err) {
          setStatus("Logout failed");
        }
        await this.refreshSession();
        updateAuthUI();
        updateDashboardAccount();
      };
    }
    if (dashboardLogoutBtn) {
      dashboardLogoutBtn.onclick = async () => {
        try {
          await this.api.logout();
          localStorage.removeItem("lf_token");
        } catch (_err) {
          setStatus("Logout failed");
        }
        await this.refreshSession();
        updateAuthUI();
        updateDashboardAccount();
      };
    }
  }
}

const app = new LifeForge();
