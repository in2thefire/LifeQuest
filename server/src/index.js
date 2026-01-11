import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "change_me";
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5500";
const originEntries = FRONTEND_ORIGIN.split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);
const allowedOrigins = new Set([
  ...originEntries,
  "http://localhost:5500",
  "http://127.0.0.1:5500",
]);
const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

const DAILY_XP_CAP = 200;
const DAILY_COINS_CAP = 25;
const FOCUS_DAILY_XP_CAP = 100;
const FOCUS_DAILY_COINS_CAP = 5;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const RANK_TIERS = [
  { name: "Ember", min: 1, max: 3 },
  { name: "Initiate", min: 4, max: 7 },
  { name: "Adept", min: 8, max: 12 },
  { name: "Pathforger", min: 13, max: 20 },
  { name: "Warden", min: 21, max: 27 },
  { name: "Ascendant", min: 28, max: 34 },
  { name: "Architect", min: 35, max: 42 },
  { name: "Paragon", min: 43, max: 50 },
  { name: "Mythforged", min: 51, max: 57 },
  { name: "Luminary", min: 58, max: 64 },
  { name: "Exemplar", min: 65, max: 72 },
  { name: "Chronosmith", min: 73, max: 80 },
  { name: "Mythkeeper", min: 81, max: 87 },
  { name: "Eternal Architect", min: 88, max: 94 },
  { name: "Ascended", min: 95, max: 100 },
];

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

if (process.env.NODE_ENV === "production" && allowedOrigins.has("*")) {
  throw new Error("FRONTEND_ORIGIN cannot include '*' in production.");
}

app.set("etag", false);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, allowedOrigins.has(origin));
    },
    credentials: true,
  })
);
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/", // важно
};

const signToken = (user) =>
  jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "7d" });

const setAuthCookie = (res, token) => {
  res.cookie("lf_token", token, cookieOptions);
};

const serializeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
});

const serializeProgress = (progress) => ({
  xpTotal: progress.xpTotal,
  level: progress.level,
  forgeCoins: progress.forgeCoins,
  rank: progress.rank,
});

const serializeFocusSession = (session) => ({
  id: session.id,
  userId: session.userId,
  durationMin: session.durationMin,
  type: session.type,
  startedAt: session.startedAt,
  endedAt: session.endedAt,
  completed: session.completed,
  cancelled: session.cancelled,
  todoId: session.todoId,
  notes: session.notes,
  xpAwarded: session.xpAwarded,
  coinsAwarded: session.coinsAwarded,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
});

const getRankForLevel = (level) => {
  const normalized = Math.max(1, level);
  return (
    RANK_TIERS.find(
      (tier) => normalized >= tier.min && normalized <= tier.max
    ) || RANK_TIERS[RANK_TIERS.length - 1]
  );
};

const parseDateOnly = (value) => {
  if (!value || !DATE_RE.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const parseOptionalDate = (value) => {
  if (!value) return null;
  if (DATE_RE.test(value)) return parseDateOnly(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const toDateKey = (date) => date.toISOString().slice(0, 10);

const getRewardForStatus = (type, difficulty, status) => {
  const reward = REWARDS[type]?.[difficulty];
  if (!reward) return { xp: 0, coins: 0 };
  if (status !== SUCCESS_STATUS[type]) return { xp: 0, coins: 0 };
  return reward;
};

const getTodoReward = (priority) =>
  TODO_REWARDS[priority] || TODO_REWARDS.MEDIUM;

const getFocusReward = (durationMin) => {
  const minutes = Number.parseInt(durationMin, 10);
  if (!Number.isFinite(minutes) || minutes < 25) {
    return { xp: 0, coins: 0 };
  }
  if (minutes >= 90) return { xp: 30, coins: 2 };
  if (minutes >= 50) return { xp: 20, coins: 1 };
  return { xp: 10, coins: 0 };
};

const getDayBounds = (date) => {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

const getDailyTotals = async (tx, userId, start, end) => {
  const [habitTotals, todoTotals] = await Promise.all([
    tx.habitLog.aggregate({
      where: { userId, date: { gte: start, lt: end } },
      _sum: { xp: true, coins: true },
    }),
    tx.todo.aggregate({
      where: { userId, completedAt: { gte: start, lt: end } },
      _sum: { xpReward: true, coinReward: true },
    }),
  ]);
  return {
    xp: (habitTotals._sum.xp || 0) + (todoTotals._sum.xpReward || 0),
    coins: (habitTotals._sum.coins || 0) + (todoTotals._sum.coinReward || 0),
  };
};

const getFocusDailyTotals = async (tx, userId, start, end) => {
  const totals = await tx.focusSession.aggregate({
    where: { userId, startedAt: { gte: start, lt: end } },
    _sum: { xpAwarded: true, coinsAwarded: true },
  });
  return {
    xp: totals._sum.xpAwarded || 0,
    coins: totals._sum.coinsAwarded || 0,
  };
};

const isSameUtcDay = (value, start, end) =>
  value && value >= start && value < end;

const getFocusFlowChainDays = async (tx, userId) => {
  const today = new Date();
  const { start: todayStart, end: todayEnd } = getDayBounds(today);
  const lookbackDays = 365;
  const rangeStart = new Date(todayStart);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - lookbackDays);
  // TODO: Persist Flow stats once user stats move server-side.
  const sessions = await tx.focusSession.findMany({
    where: {
      userId,
      completed: true,
      startedAt: { gte: rangeStart, lt: todayEnd },
    },
    select: { startedAt: true },
  });
  const daySet = new Set(sessions.map((s) => toDateKey(s.startedAt)));
  let chain = 0;
  for (let i = 0; i <= lookbackDays; i += 1) {
    const day = new Date(todayStart);
    day.setUTCDate(todayStart.getUTCDate() - i);
    if (daySet.has(toDateKey(day))) {
      chain += 1;
    } else {
      break;
    }
  }
  return chain;
};
const getOrCreateProgress = async (tx, userId) => {
  const existing = await tx.userProgress.findUnique({ where: { userId } });
  if (existing) return existing;
  const level = 1;
  const rank = getRankForLevel(level).name;
  return tx.userProgress.create({
    data: {
      userId,
      xpTotal: 0,
      level,
      forgeCoins: 0,
      rank,
    },
  });
};

const authRequired = async (req, res, next) => {
  const token = req.cookies.lf_token;
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    req.user = user;
    req.progress = await getOrCreateProgress(prisma, user.id);
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

const rateLimitWindowMs = 10 * 60 * 1000;
const rateLimitMax = 20;
const rateLimitState = new Map();
const rateLimitAuth = (req, res, next) => {
  const key = req.ip;
  const now = Date.now();
  const entry = rateLimitState.get(key) || {
    count: 0,
    reset: now + rateLimitWindowMs,
  };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + rateLimitWindowMs;
  }
  entry.count += 1;
  rateLimitState.set(key, entry);
  if (entry.count > rateLimitMax) {
    return res
      .status(429)
      .json({ error: "Too many requests. Try again later." });
  }
  return next();
};

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          "http://localhost:4000/api/auth/google/callback",
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName;
          let user = await prisma.user.findFirst({
            where: { OR: [{ googleId }, { email }] },
          });
          if (!user) {
            user = await prisma.user.create({
              data: {
                googleId,
                email,
                name,
                progress: {
                  create: {
                    level: 1,
                    xpTotal: 0,
                    forgeCoins: 0,
                    rank: getRankForLevel(1).name,
                  },
                },
              },
            });
          } else if (!user.googleId) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId },
            });
          }
          await getOrCreateProgress(prisma, user.id);
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

app.get("/health", (_req, res) => res.json({ ok: true }));

app.post("/api/auth/register", rateLimitAuth, async (req, res) => {
  const { email, password, name } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: "Email in use" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: name || null,
      progress: {
        create: {
          level: 1,
          xpTotal: 0,
          forgeCoins: 0,
          rank: getRankForLevel(1).name,
        },
      },
    },
  });
  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({ user: serializeUser(user) });
});

app.post("/api/auth/login", rateLimitAuth, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  await getOrCreateProgress(prisma, user.id);
  const token = signToken(user);
  setAuthCookie(res, token);
  return res.json({ user: serializeUser(user) });
});

app.post("/api/auth/logout", (_req, res) => {
  res.clearCookie("lf_token", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return res.status(200).json({ ok: true });
});

app.get("/api/auth/me", authRequired, (req, res) => {
  res.json({ user: serializeUser(req.user) });
});

app.get("/api/me", authRequired, async (req, res) => {
  res.json({
    user: serializeUser(req.user),
    progress: serializeProgress(req.progress),
  });
});

if (googleEnabled) {
  app.get(
    "/api/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    })
  );

  app.get(
    "/api/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/" }),
    (req, res) => {
      const token = signToken(req.user);
      setAuthCookie(res, token);
      res.redirect(FRONTEND_ORIGIN);
    }
  );
} else {
  app.get("/api/auth/google", (_req, res) => {
    res.status(503).json({ error: "Google OAuth not configured" });
  });
  app.get("/api/auth/google/callback", (_req, res) => {
    res.status(503).json({ error: "Google OAuth not configured" });
  });
}

app.get("/api/progress", authRequired, async (req, res) => {
  const progress = req.progress;
  const { start, end } = getDayBounds(new Date());
  const totals = await getDailyTotals(prisma, req.user.id, start, end);
  res.json({
    progress: serializeProgress(progress),
    today: {
      xp: totals.xp,
      coins: totals.coins,
    },
  });
});

app.get("/api/habits", authRequired, async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({
    habits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      type: habit.type,
      difficulty: habit.difficulty,
      color: habit.color,
      schedule: habit.schedule,
      createdAt: habit.createdAt,
    })),
  });
});

app.post("/api/habits", authRequired, async (req, res) => {
  const { title, type, difficulty, schedule, color } = req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title required" });
  }
  if (!["FORGE", "PURGE"].includes(type)) {
    return res.status(400).json({ error: "Invalid habit type" });
  }
  const diff = Number.parseInt(difficulty, 10);
  if (![1, 2, 3].includes(diff)) {
    return res.status(400).json({ error: "Difficulty must be 1, 2, or 3" });
  }
  const habit = await prisma.habit.create({
    data: {
      userId: req.user.id,
      title: title.trim(),
      type,
      difficulty: diff,
      schedule: schedule ?? null,
      color: color || "#58a6ff",
    },
  });
  res.status(201).json({
    habit: {
      id: habit.id,
      title: habit.title,
      type: habit.type,
      difficulty: habit.difficulty,
      color: habit.color,
      schedule: habit.schedule,
      createdAt: habit.createdAt,
    },
  });
});

app.patch("/api/habits/:id", authRequired, async (req, res) => {
  const { title, type, difficulty, schedule, color } = req.body || {};
  const updates = {};
  if (typeof title === "string") updates.title = title.trim();
  if (["FORGE", "PURGE"].includes(type)) updates.type = type;
  if (difficulty !== undefined) {
    const diff = Number.parseInt(difficulty, 10);
    if (![1, 2, 3].includes(diff)) {
      return res.status(400).json({ error: "Difficulty must be 1, 2, or 3" });
    }
    updates.difficulty = diff;
  }
  if (schedule !== undefined) updates.schedule = schedule ?? null;
  if (typeof color === "string") updates.color = color;
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });
  const updated = await prisma.habit.update({
    where: { id: habit.id },
    data: updates,
  });
  res.json({
    habit: {
      id: updated.id,
      title: updated.title,
      type: updated.type,
      difficulty: updated.difficulty,
      color: updated.color,
      schedule: updated.schedule,
      createdAt: updated.createdAt,
    },
  });
});

app.delete("/api/habits/:id", authRequired, async (req, res) => {
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });
  await prisma.habit.delete({ where: { id: habit.id } });
  res.status(204).send();
});

app.post("/api/habits/:id/log", authRequired, async (req, res) => {
  const { date, status } = req.body || {};
  const logDate = parseDateOnly(date);
  if (!logDate) {
    return res.status(400).json({ error: "Date must be YYYY-MM-DD" });
  }
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const allowedStatuses = [
    SUCCESS_STATUS[habit.type],
    FAILURE_STATUS[habit.type],
  ];
  if (status && !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status for habit type" });
  }

  const response = await prisma.$transaction(async (tx) => {
    const existing = await tx.habitLog.findUnique({
      where: {
        userId_habitId_date: {
          userId: req.user.id,
          habitId: habit.id,
          date: logDate,
        },
      },
    });
    const nextStatus =
      status ||
      (existing && existing.status === SUCCESS_STATUS[habit.type]
        ? FAILURE_STATUS[habit.type]
        : SUCCESS_STATUS[habit.type]);

    if (existing && existing.status === nextStatus) {
      const progress = await getOrCreateProgress(tx, req.user.id);
      return { log: existing, progress };
    }

    const baseReward = getRewardForStatus(
      habit.type,
      habit.difficulty,
      nextStatus
    );
    const { start: dayStart, end: dayEnd } = getDayBounds(logDate);
    const totals = await getDailyTotals(tx, req.user.id, dayStart, dayEnd);
    const existingXp = existing?.xp || 0;
    const existingCoins = existing?.coins || 0;
    const rawDeltaXp = baseReward.xp - existingXp;
    const rawDeltaCoins = baseReward.coins - existingCoins;
    const usedXp = totals.xp - existingXp;
    const usedCoins = totals.coins - existingCoins;
    let appliedDeltaXp = rawDeltaXp;
    let appliedDeltaCoins = rawDeltaCoins;
    if (rawDeltaXp > 0) {
      const remainingXp = Math.max(0, DAILY_XP_CAP - usedXp);
      appliedDeltaXp = Math.min(rawDeltaXp, remainingXp);
    }
    if (rawDeltaCoins > 0) {
      const remainingCoins = Math.max(0, DAILY_COINS_CAP - usedCoins);
      appliedDeltaCoins = Math.min(rawDeltaCoins, remainingCoins);
    }
    const awardedXp = existingXp + appliedDeltaXp;
    const awardedCoins = existingCoins + appliedDeltaCoins;

    const updatedLog = existing
      ? await tx.habitLog.update({
          where: {
            userId_habitId_date: {
              userId: req.user.id,
              habitId: habit.id,
              date: logDate,
            },
          },
          data: {
            status: nextStatus,
            xp: awardedXp,
            coins: awardedCoins,
          },
        })
      : await tx.habitLog.create({
          data: {
            userId: req.user.id,
            habitId: habit.id,
            date: logDate,
            status: nextStatus,
            xp: awardedXp,
            coins: awardedCoins,
          },
        });

    const progress = await getOrCreateProgress(tx, req.user.id);
    const nextXpTotal = Math.max(0, progress.xpTotal + appliedDeltaXp);
    const nextCoins = Math.max(0, progress.forgeCoins + appliedDeltaCoins);
    const nextLevel = Math.floor(nextXpTotal / 100) + 1;
    const nextRank = getRankForLevel(nextLevel).name;
    const updatedProgress = await tx.userProgress.update({
      where: { userId: req.user.id },
      data: {
        xpTotal: nextXpTotal,
        forgeCoins: nextCoins,
        level: nextLevel,
        rank: nextRank,
      },
    });

    return { log: updatedLog, progress: updatedProgress };
  });

  res.json({
    log: {
      id: response.log.id,
      habitId: response.log.habitId,
      date: toDateKey(response.log.date),
      status: response.log.status,
      xp: response.log.xp,
      coins: response.log.coins,
    },
    progress: serializeProgress(response.progress),
  });
});

app.get("/api/habits/:id/logs", authRequired, async (req, res) => {
  const { from, to } = req.query || {};
  const habit = await prisma.habit.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!habit) return res.status(404).json({ error: "Habit not found" });

  const today = new Date();
  const fallbackFrom = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  fallbackFrom.setUTCDate(fallbackFrom.getUTCDate() - 7 * 26);
  const start = parseDateOnly(from) || fallbackFrom;
  const endInput =
    parseDateOnly(to) ||
    new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
    );
  const end = new Date(endInput);
  end.setUTCDate(end.getUTCDate() + 1);

  const logs = await prisma.habitLog.findMany({
    where: {
      userId: req.user.id,
      habitId: habit.id,
      date: { gte: start, lt: end },
    },
    orderBy: { date: "asc" },
  });
  res.json({
    logs: logs.map((log) => ({
      id: log.id,
      habitId: log.habitId,
      date: toDateKey(log.date),
      status: log.status,
      xp: log.xp,
      coins: log.coins,
    })),
  });
});

app.get("/api/habits/stats", authRequired, async (req, res) => {
  const { from, to } = req.query || {};
  const startInput = from ? parseDateOnly(from) : null;
  const endInput = to ? parseDateOnly(to) : null;
  if (from && !startInput) {
    return res.status(400).json({ error: "from must be YYYY-MM-DD" });
  }
  if (to && !endInput) {
    return res.status(400).json({ error: "to must be YYYY-MM-DD" });
  }

  const today = new Date();
  const defaultEnd = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  );
  const endDate = endInput || defaultEnd;
  let startDate = startInput ? new Date(startInput) : new Date(endDate);
  if (!startInput) startDate.setUTCDate(startDate.getUTCDate() - 29);

  const maxRangeDays = 90;
  const rangeDays = Math.floor((endDate - startDate) / 86400000) + 1;
  if (rangeDays > maxRangeDays) {
    startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - (maxRangeDays - 1));
  }

  const end = new Date(endDate);
  end.setUTCDate(end.getUTCDate() + 1);

  const habits = await prisma.habit.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, title: true, type: true, color: true },
  });
  if (habits.length === 0) {
    return res.json({ habits: [], logsByHabit: {} });
  }
  const habitIds = habits.map((habit) => habit.id);
  const logs = await prisma.habitLog.findMany({
    where: {
      userId: req.user.id,
      habitId: { in: habitIds },
      date: { gte: startDate, lt: end },
    },
    orderBy: [{ habitId: "asc" }, { date: "asc" }],
  });
  const logsByHabit = {};
  logs.forEach((log) => {
    if (!logsByHabit[log.habitId]) logsByHabit[log.habitId] = [];
    logsByHabit[log.habitId].push({
      date: toDateKey(log.date),
      status: log.status,
      xp: log.xp,
      coins: log.coins,
    });
  });
  res.json({
    habits: habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      type: habit.type,
      color: habit.color,
    })),
    logsByHabit,
  });
});

app.get("/api/todos", authRequired, async (req, res) => {
  const todos = await prisma.todo.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: "asc" },
  });
  const { start, end } = getDayBounds(new Date());
  res.json({
    todos: todos.map((todo) => {
      const baseReward = getTodoReward(todo.priority);
      const completedToday = isSameUtcDay(todo.completedAt, start, end);
      const effectiveCompletedAt = todo.isDaily
        ? completedToday
          ? todo.completedAt
          : null
        : todo.completedAt;
      const reward =
        effectiveCompletedAt !== null
          ? { xp: todo.xpReward, coins: todo.coinReward }
          : baseReward;
      return {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        color: todo.color,
        xpReward: reward.xp,
        coinReward: reward.coins,
        isDaily: todo.isDaily,
        dueDate: todo.dueDate,
        completedAt: effectiveCompletedAt,
        createdAt: todo.createdAt,
      };
    }),
  });
});

app.post("/api/todos", authRequired, async (req, res) => {
  const { title, description, priority, isDaily, dueDate, color } =
    req.body || {};
  if (!title || typeof title !== "string") {
    return res.status(400).json({ error: "Title required" });
  }
  const nextPriority = priority || "MEDIUM";
  if (!["LOW", "MEDIUM", "HIGH"].includes(nextPriority)) {
    return res.status(400).json({ error: "Invalid priority" });
  }
  const parsedDueDate = parseOptionalDate(dueDate);
  if (dueDate && !parsedDueDate) {
    return res.status(400).json({ error: "Invalid due date" });
  }
  const reward = getTodoReward(nextPriority);
  const todo = await prisma.todo.create({
    data: {
      userId: req.user.id,
      title: title.trim(),
      description: typeof description === "string" ? description.trim() : null,
      priority: nextPriority,
      color: typeof color === "string" ? color : "#58a6ff",
      xpReward: reward.xp,
      coinReward: reward.coins,
      isDaily: Boolean(isDaily),
      dueDate: parsedDueDate,
    },
  });
  res.status(201).json({
    todo: {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      color: todo.color,
      xpReward: todo.xpReward,
      coinReward: todo.coinReward,
      isDaily: todo.isDaily,
      dueDate: todo.dueDate,
      completedAt: todo.completedAt,
      createdAt: todo.createdAt,
    },
  });
});

app.patch("/api/todos/:id", authRequired, async (req, res) => {
  const { title, description, priority, isDaily, dueDate, color } =
    req.body || {};
  const todo = await prisma.todo.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!todo) return res.status(404).json({ error: "Todo not found" });
  const updates = {};
  if (typeof title === "string") updates.title = title.trim();
  if (typeof description === "string") updates.description = description.trim();
  if (description === null) updates.description = null;
  if (priority !== undefined) {
    if (!["LOW", "MEDIUM", "HIGH"].includes(priority)) {
      return res.status(400).json({ error: "Invalid priority" });
    }
    updates.priority = priority;
  }
  if (typeof color === "string") updates.color = color;
  if (isDaily !== undefined) updates.isDaily = Boolean(isDaily);
  if (dueDate !== undefined) {
    const parsedDueDate = parseOptionalDate(dueDate);
    if (dueDate && !parsedDueDate) {
      return res.status(400).json({ error: "Invalid due date" });
    }
    updates.dueDate = parsedDueDate;
  }
  const { start, end } = getDayBounds(new Date());
  const nextIsDaily = updates.isDaily ?? todo.isDaily;
  const completedNow =
    todo.completedAt &&
    (!nextIsDaily || isSameUtcDay(todo.completedAt, start, end));
  const nextPriority = updates.priority || todo.priority;
  const baseReward = getTodoReward(nextPriority);
  if (!completedNow) {
    updates.xpReward = baseReward.xp;
    updates.coinReward = baseReward.coins;
  }
  if (
    nextIsDaily &&
    todo.completedAt &&
    !isSameUtcDay(todo.completedAt, start, end)
  ) {
    updates.completedAt = null;
  }
  const updated = await prisma.todo.update({
    where: { id: todo.id },
    data: updates,
  });
  res.json({
    todo: {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      priority: updated.priority,
      color: updated.color,
      xpReward: updated.xpReward,
      coinReward: updated.coinReward,
      isDaily: updated.isDaily,
      dueDate: updated.dueDate,
      completedAt: updated.completedAt,
      createdAt: updated.createdAt,
    },
  });
});

app.post("/api/todos/:id/complete", authRequired, async (req, res) => {
  const response = await prisma.$transaction(async (tx) => {
    const todo = await tx.todo.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!todo) return { error: "Todo not found" };
    const { start, end } = getDayBounds(new Date());
    const completedToday = isSameUtcDay(todo.completedAt, start, end);
    const completedNow = todo.isDaily
      ? completedToday
      : Boolean(todo.completedAt);
    const baseReward = getTodoReward(todo.priority);
    const existingXp = completedNow ? todo.xpReward : 0;
    const existingCoins = completedNow ? todo.coinReward : 0;

    if (completedNow) {
      const progress = await getOrCreateProgress(tx, req.user.id);
      const nextXpTotal = Math.max(0, progress.xpTotal - existingXp);
      const nextCoins = Math.max(0, progress.forgeCoins - existingCoins);
      const nextLevel = Math.floor(nextXpTotal / 100) + 1;
      const nextRank = getRankForLevel(nextLevel).name;
      const updatedTodo = await tx.todo.update({
        where: { id: todo.id },
        data: {
          completedAt: null,
          xpReward: baseReward.xp,
          coinReward: baseReward.coins,
        },
      });
      const updatedProgress = await tx.userProgress.update({
        where: { userId: req.user.id },
        data: {
          xpTotal: nextXpTotal,
          forgeCoins: nextCoins,
          level: nextLevel,
          rank: nextRank,
        },
      });
      return { todo: updatedTodo, progress: updatedProgress };
    }

    const totals = await getDailyTotals(tx, req.user.id, start, end);
    const remainingXp = Math.max(0, DAILY_XP_CAP - totals.xp);
    const remainingCoins = Math.max(0, DAILY_COINS_CAP - totals.coins);
    const appliedXp = Math.min(baseReward.xp, remainingXp);
    const appliedCoins = Math.min(baseReward.coins, remainingCoins);
    const progress = await getOrCreateProgress(tx, req.user.id);
    const nextXpTotal = Math.max(0, progress.xpTotal + appliedXp);
    const nextCoins = Math.max(0, progress.forgeCoins + appliedCoins);
    const nextLevel = Math.floor(nextXpTotal / 100) + 1;
    const nextRank = getRankForLevel(nextLevel).name;
    const updatedTodo = await tx.todo.update({
      where: { id: todo.id },
      data: {
        completedAt: new Date(),
        xpReward: appliedXp,
        coinReward: appliedCoins,
      },
    });
    const updatedProgress = await tx.userProgress.update({
      where: { userId: req.user.id },
      data: {
        xpTotal: nextXpTotal,
        forgeCoins: nextCoins,
        level: nextLevel,
        rank: nextRank,
      },
    });
    return { todo: updatedTodo, progress: updatedProgress };
  });

  if (response.error) {
    return res.status(404).json({ error: response.error });
  }
  res.json({
    todo: {
      id: response.todo.id,
      title: response.todo.title,
      description: response.todo.description,
      priority: response.todo.priority,
      color: response.todo.color,
      xpReward: response.todo.xpReward,
      coinReward: response.todo.coinReward,
      isDaily: response.todo.isDaily,
      dueDate: response.todo.dueDate,
      completedAt: response.todo.completedAt,
      createdAt: response.todo.createdAt,
    },
    progress: serializeProgress(response.progress),
  });
});

app.delete("/api/todos/:id", authRequired, async (req, res) => {
  const todo = await prisma.todo.findFirst({
    where: { id: req.params.id, userId: req.user.id },
  });
  if (!todo) return res.status(404).json({ error: "Todo not found" });
  await prisma.todo.delete({ where: { id: todo.id } });
  res.status(204).send();
});

app.post("/api/focus/start", authRequired, async (req, res) => {
  const { durationMin, type, todoId } = req.body || {};
  const minutes = Number.parseInt(durationMin, 10);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return res
      .status(400)
      .json({ error: "Duration must be a positive number" });
  }
  if (type && !["DEEP", "LIGHT"].includes(type)) {
    return res.status(400).json({ error: "Invalid focus type" });
  }
  if (todoId) {
    const todo = await prisma.todo.findFirst({
      where: { id: todoId, userId: req.user.id },
    });
    if (!todo) return res.status(400).json({ error: "Todo not found" });
  }
  const session = await prisma.focusSession.create({
    data: {
      userId: req.user.id,
      durationMin: minutes,
      type: type || "DEEP",
      startedAt: new Date(),
      todoId: todoId || null,
    },
  });
  res.status(201).json({ session: serializeFocusSession(session) });
});

app.post("/api/focus/:id/complete", authRequired, async (req, res) => {
  const { endedAt, notes } = req.body || {};
  const parsedEndedAt = endedAt ? parseOptionalDate(endedAt) : new Date();
  if (endedAt && !parsedEndedAt) {
    return res.status(400).json({ error: "Invalid endedAt" });
  }

  const response = await prisma.$transaction(async (tx) => {
    const session = await tx.focusSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) return { error: "Focus session not found" };
    if (session.cancelled) return { error: "Focus session cancelled" };

    const baseReward = getFocusReward(session.durationMin);
    const { start, end } = getDayBounds(session.startedAt);
    const totals = await getFocusDailyTotals(tx, req.user.id, start, end);
    const existingXp = session.xpAwarded || 0;
    const existingCoins = session.coinsAwarded || 0;
    const rawDeltaXp = baseReward.xp - existingXp;
    const rawDeltaCoins = baseReward.coins - existingCoins;
    const usedXp = totals.xp - existingXp;
    const usedCoins = totals.coins - existingCoins;
    let appliedDeltaXp = rawDeltaXp;
    let appliedDeltaCoins = rawDeltaCoins;
    if (rawDeltaXp > 0) {
      const remainingXp = Math.max(0, FOCUS_DAILY_XP_CAP - usedXp);
      appliedDeltaXp = Math.min(rawDeltaXp, remainingXp);
    }
    if (rawDeltaCoins > 0) {
      const remainingCoins = Math.max(0, FOCUS_DAILY_COINS_CAP - usedCoins);
      appliedDeltaCoins = Math.min(rawDeltaCoins, remainingCoins);
    }
    const awardedXp = existingXp + appliedDeltaXp;
    const awardedCoins = existingCoins + appliedDeltaCoins;
    const noteUpdate =
      notes !== undefined ? (notes ? notes.trim() : null) : session.notes;

    const updatedSession = await tx.focusSession.update({
      where: { id: session.id },
      data: {
        completed: true,
        cancelled: false,
        endedAt: parsedEndedAt || new Date(),
        notes: noteUpdate,
        xpAwarded: awardedXp,
        coinsAwarded: awardedCoins,
      },
    });

    const progress = await getOrCreateProgress(tx, req.user.id);
    const nextXpTotal = Math.max(0, progress.xpTotal + appliedDeltaXp);
    const nextCoins = Math.max(0, progress.forgeCoins + appliedDeltaCoins);
    const nextLevel = Math.floor(nextXpTotal / 100) + 1;
    const nextRank = getRankForLevel(nextLevel).name;
    const updatedProgress = await tx.userProgress.update({
      where: { userId: req.user.id },
      data: {
        xpTotal: nextXpTotal,
        forgeCoins: nextCoins,
        level: nextLevel,
        rank: nextRank,
      },
    });
    return { session: updatedSession, progress: updatedProgress };
  });

  if (response.error) {
    return res.status(400).json({ error: response.error });
  }
  res.json({
    session: serializeFocusSession(response.session),
    progress: serializeProgress(response.progress),
  });
});

app.post("/api/focus/:id/cancel", authRequired, async (req, res) => {
  const response = await prisma.$transaction(async (tx) => {
    const session = await tx.focusSession.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!session) return { error: "Focus session not found" };

    const existingXp = session.xpAwarded || 0;
    const existingCoins = session.coinsAwarded || 0;
    const progress = await getOrCreateProgress(tx, req.user.id);
    const nextXpTotal = Math.max(0, progress.xpTotal - existingXp);
    const nextCoins = Math.max(0, progress.forgeCoins - existingCoins);
    const nextLevel = Math.floor(nextXpTotal / 100) + 1;
    const nextRank = getRankForLevel(nextLevel).name;

    const updatedSession = await tx.focusSession.update({
      where: { id: session.id },
      data: {
        completed: false,
        cancelled: true,
        endedAt: new Date(),
        xpAwarded: 0,
        coinsAwarded: 0,
      },
    });
    const updatedProgress = await tx.userProgress.update({
      where: { userId: req.user.id },
      data: {
        xpTotal: nextXpTotal,
        forgeCoins: nextCoins,
        level: nextLevel,
        rank: nextRank,
      },
    });
    return { session: updatedSession, progress: updatedProgress };
  });

  if (response.error) {
    return res.status(404).json({ error: response.error });
  }
  res.json({
    session: serializeFocusSession(response.session),
    progress: serializeProgress(response.progress),
  });
});

app.get("/api/focus/today", authRequired, async (req, res) => {
  const today = new Date();
  const { start, end } = getDayBounds(today);
  const [sessions, totals, flowChainDays] = await Promise.all([
    prisma.focusSession.findMany({
      where: { userId: req.user.id, startedAt: { gte: start, lt: end } },
      orderBy: { startedAt: "asc" },
    }),
    getFocusDailyTotals(prisma, req.user.id, start, end),
    getFocusFlowChainDays(prisma, req.user.id),
  ]);

  const completedSessions = sessions.filter((session) => session.completed);
  const todayTotalMinutes = completedSessions.reduce(
    (sum, session) => sum + session.durationMin,
    0
  );
  res.json({
    todaySessions: sessions.map(serializeFocusSession),
    todayTotalMinutes,
    todayCompletedCount: completedSessions.length,
    flowChainDays,
    focusCapsStatus: {
      xp: totals.xp,
      coins: totals.coins,
      xpCap: FOCUS_DAILY_XP_CAP,
      coinsCap: FOCUS_DAILY_COINS_CAP,
    },
  });
});

app.get("/api/focus/range", authRequired, async (req, res) => {
  const { from, to } = req.query || {};
  const start = parseDateOnly(from);
  const endInput = parseDateOnly(to);
  if (!start || !endInput) {
    return res.status(400).json({ error: "from/to must be YYYY-MM-DD" });
  }
  const end = new Date(endInput);
  end.setUTCDate(end.getUTCDate() + 1);
  const sessions = await prisma.focusSession.findMany({
    where: { userId: req.user.id, startedAt: { gte: start, lt: end } },
    orderBy: { startedAt: "asc" },
  });
  res.json({ sessions: sessions.map(serializeFocusSession) });
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
