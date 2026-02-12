"use client";

import { DateTime } from "luxon";
import { useEffect, useState } from "react";

const ZONE = "America/New_York";

function getTarget(now: DateTime) {
  const currentYearTarget = DateTime.fromObject(
    { year: now.year, month: 2, day: 14, hour: 0, minute: 0, second: 0 },
    { zone: ZONE }
  );
  if (now < currentYearTarget) return currentYearTarget;
  return DateTime.fromObject(
    { year: now.year + 1, month: 2, day: 14, hour: 0, minute: 0, second: 0 },
    { zone: ZONE }
  );
}

function formatCountdown() {
  const now = DateTime.now().setZone(ZONE);
  const target = getTarget(now);
  const diff = target.diff(now, ["days", "hours", "minutes"]).shiftTo(
    "days",
    "hours",
    "minutes"
  );
  const days = Math.max(0, Math.floor(diff.days));
  const hours = Math.max(0, Math.floor(diff.hours));
  const minutes = Math.max(0, Math.floor(diff.minutes));
  return `Opens in ${days}d ${hours}h ${minutes}m`;
}

export default function Countdown() {
  const [value, setValue] = useState(formatCountdown);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue(formatCountdown());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  return <span className="brand-countdown">{value}</span>;
}
