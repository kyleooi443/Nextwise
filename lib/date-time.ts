type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function dateValue(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid date");
  return date;
}

function zonedParts(value: Date | number, timeZone: string): ZonedParts {
  const date = typeof value === "number" ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day"), hour: read("hour"), minute: read("minute"), second: read("second") };
}

function offsetAt(epochMs: number, timeZone: string): number {
  const parts = zonedParts(epochMs, timeZone);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
  return Math.round((asUtc - Math.floor(epochMs / 1000) * 1000) / 60_000);
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function dayKeyInTimeZone(value: Date | string, timeZone: string): string {
  const date = dateValue(value);
  const parts = zonedParts(date, timeZone);
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

export function formatInTimeZone(value: Date | string, timeZone: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(dateValue(value));
}

export function addDaysToDayKey(dayKey: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey) || !Number.isInteger(days)) throw new RangeError("Expected a YYYY-MM-DD day key and whole-number day offset");
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dayKey) throw new RangeError(`Invalid day key: ${dayKey}`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function resolveLocalDateTime(year: number, month: number, day: number, time: string, timeZone: string): Date {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new RangeError("Time must use HH:mm format");
  if (!isValidTimeZone(timeZone)) throw new RangeError(`Invalid IANA time zone: ${timeZone}`);

  const [hour, minute] = time.split(":").map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  const offsets = new Set<number>();
  for (let hours = -48; hours <= 48; hours += 3) offsets.add(offsetAt(localAsUtc + hours * 60 * 60_000, timeZone));

  const candidates = [...offsets].map((offset) => localAsUtc - offset * 60_000);
  const exact = candidates.filter((candidate) => {
    const candidateParts = zonedParts(candidate, timeZone);
    return candidateParts.year === year
      && candidateParts.month === month
      && candidateParts.day === day
      && candidateParts.hour === hour
      && candidateParts.minute === minute;
  }).sort((a, b) => a - b);
  if (exact.length) return new Date(exact[0]);

  // A forward clock change creates a gap. Locate the transition itself so a
  // requested time inside the gap advances to its first valid instant.
  for (const oldOffset of offsets) {
    for (const newOffset of offsets) {
      if (newOffset <= oldOffset) continue;
      let low = localAsUtc - newOffset * 60_000;
      let high = localAsUtc - oldOffset * 60_000;
      if (low >= high || offsetAt(low, timeZone) !== oldOffset || offsetAt(high, timeZone) !== newOffset) continue;
      while (high - low > 1000) {
        // Offset lookup has whole-second precision. Keep every probe aligned
        // to a second so the final upper bound is the transition's exact start.
        const middle = Math.floor((low + high) / 2000) * 1000;
        if (offsetAt(middle, timeZone) === newOffset) high = middle;
        else low = middle;
      }
      return new Date(high);
    }
  }

  throw new RangeError(`Could not resolve ${time} in ${timeZone}`);
}

export function localTimeToInstant(date: Date, time: string, timeZone: string): Date {
  if (Number.isNaN(date.getTime())) throw new RangeError("Invalid date");
  const localDate = zonedParts(date, timeZone);
  return resolveLocalDateTime(localDate.year, localDate.month, localDate.day, time, timeZone);
}

export function localDateTimeToInstant(dayKey: string, time: string, timeZone: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) throw new RangeError("Day must use YYYY-MM-DD format");
  const date = new Date(`${dayKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dayKey) throw new RangeError(`Invalid day key: ${dayKey}`);
  return resolveLocalDateTime(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), time, timeZone);
}
