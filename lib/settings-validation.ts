import type { UserPreferences } from "@/types/nextwise";

export type PreferenceErrors = Partial<Record<"name" | "timezone" | "workStart" | "workEnd", string>>;

export function validatePreferences(preferences: Pick<UserPreferences, "name" | "timezone" | "workStart" | "workEnd">): PreferenceErrors {
  const errors: PreferenceErrors = {};
  if (!preferences.name.trim()) errors.name = "Enter your name.";
  let validTimezone = false;
  try { new Intl.DateTimeFormat("en-US", { timeZone: preferences.timezone }); validTimezone = true; } catch { /* invalid IANA zone */ }
  if (!validTimezone) errors.timezone = "Choose a valid IANA time zone.";
  const validStart = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(preferences.workStart);
  const validEnd = /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(preferences.workEnd);
  if (!validStart) errors.workStart = "Enter a valid start time.";
  if (!validEnd) errors.workEnd = "Enter a valid end time.";
  else if (validStart && preferences.workEnd <= preferences.workStart) errors.workEnd = "Work end must be later than work start.";
  return errors;
}
