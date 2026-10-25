import assert from "node:assert/strict";
import test from "node:test";

test("validates IANA zones and formats calendar days in that zone", async () => {
  const { isValidTimeZone, dayKeyInTimeZone, formatInTimeZone } = await import("./date-time.ts");

  assert.equal(isValidTimeZone("Asia/Manila"), true);
  assert.equal(isValidTimeZone("Mars/Olympus"), false);
  assert.equal(dayKeyInTimeZone("2026-10-25T18:00:00.000Z", "Asia/Manila"), "2026-10-26");
  assert.equal(formatInTimeZone("2026-10-25T18:00:00.000Z", "Asia/Manila", { hour: "numeric", minute: "2-digit", hourCycle: "h23" }), "02:00");
});

test("converts local wall times deterministically through daylight-saving changes", async () => {
  const { localTimeToInstant } = await import("./date-time.ts");

  assert.equal(localTimeToInstant(new Date("2026-03-08T12:00:00.000Z"), "02:30", "America/Los_Angeles").toISOString(), "2026-03-08T10:00:00.000Z");
  assert.equal(localTimeToInstant(new Date("2026-11-01T12:00:00.000Z"), "01:30", "America/Los_Angeles").toISOString(), "2026-11-01T08:30:00.000Z");
  assert.equal(localTimeToInstant(new Date("2026-10-26T12:00:00.000Z"), "09:00", "Asia/Manila").toISOString(), "2026-10-26T01:00:00.000Z");
  assert.throws(() => localTimeToInstant(new Date(), "25:75", "Asia/Manila"), /HH:mm/);
});

test("converts explicit local calendar dates and advances day keys safely", async () => {
  const { addDaysToDayKey, localDateTimeToInstant } = await import("./date-time.ts");

  assert.equal(addDaysToDayKey("2026-10-26", 1), "2026-10-27");
  assert.equal(addDaysToDayKey("2026-12-31", 1), "2027-01-01");
  assert.equal(localDateTimeToInstant("2026-10-26", "23:59", "Asia/Manila").toISOString(), "2026-10-26T15:59:00.000Z");
  assert.equal(localDateTimeToInstant("2026-11-01", "01:30", "America/Los_Angeles").toISOString(), "2026-11-01T08:30:00.000Z");
});
