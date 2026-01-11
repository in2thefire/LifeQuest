const computeNormalizedSeries = (days, mode) => {
  let missedStreak = 0;
  const labels = [];
  const values = [];
  const meta = { missedStreaks: [], completed: [] };

  days.forEach((day) => {
    labels.push(day.date);
    if (mode === "global" && Number.isFinite(day.doneRatio)) {
      const ratio = Math.max(0, Math.min(1, day.doneRatio));
      values.push(0.08 + ratio * 0.77);
      meta.missedStreaks.push(null);
      meta.completed.push(null);
      return;
    }

    if (day.done) {
      missedStreak = 0;
      values.push(0.85);
      meta.completed.push(true);
    } else {
      missedStreak += 1;
      if (missedStreak === 1) values.push(0.6);
      else if (missedStreak === 2) values.push(0.42);
      else if (missedStreak === 3) values.push(0.28);
      else if (missedStreak === 4) values.push(0.16);
      else values.push(0.08);
      meta.completed.push(false);
    }
    meta.missedStreaks.push(missedStreak);
  });

  return { labels, values, meta };
};

const DoneMissedAxisLabelsPlugin = {
  id: "doneMissedAxisLabels",
  afterDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    const { left, top, bottom } = chartArea;
    ctx.save();
    ctx.fillStyle = "rgba(201, 209, 217, 0.65)";
    ctx.font = "600 12px sans-serif";
    ctx.textBaseline = "top";
    ctx.fillText("Done", left + 4, top + 4);
    ctx.textBaseline = "bottom";
    ctx.fillText("Missed", left + 4, bottom - 4);
    ctx.restore();
  },
};

const formatDoneMissedTooltip = (completed, missedStreak) => {
  if (completed) return "Done";
  if (missedStreak >= 5) return "Abandoned";
  if (missedStreak === 1) return "Missed (1 day)";
  if (missedStreak === 2) return "Missed (2 days)";
  if (missedStreak === 3) return "Missed (3 days)";
  if (missedStreak === 4) return "Missed (4 days)";
  return "Missed";
};
