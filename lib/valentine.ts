import { DateTime } from "luxon";

const ZONE = "America/New_York";

export function nowNY() {
  return DateTime.now().setZone(ZONE);
}

export function currentYear() {
  return nowNY().year;
}

export function unlockDate(year: number) {
  return DateTime.fromObject(
    { year, month: 2, day: 14, hour: 0, minute: 0, second: 0 },
    { zone: ZONE }
  );
}

export function isYearUnlocked(year: number, now = nowNY()) {
  if (year < now.year) return true;
  if (year > now.year) return false;
  return now >= unlockDate(year);
}

export function countdownToUnlock(now = nowNY()) {
  const unlock = unlockDate(now.year);
  if (now >= unlock) return null;
  const diff = unlock.diff(now, ["days", "hours", "minutes"]).shiftTo(
    "days",
    "hours",
    "minutes"
  );
  return {
    days: Math.max(0, Math.floor(diff.days)),
    hours: Math.max(0, Math.floor(diff.hours)),
    minutes: Math.max(0, Math.floor(diff.minutes)),
    unlockIso: unlock.toISO()
  };
}
