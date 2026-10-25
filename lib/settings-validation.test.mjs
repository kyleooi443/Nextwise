import assert from "node:assert/strict";
import test from "node:test";
import { validatePreferences } from "./settings-validation.ts";

const validPreferences = {
  name: "Jane Doe",
  timezone: "Asia/Manila",
  workStart: "08:00",
  workEnd: "20:00",
};

test("accepts a nonblank name, valid IANA zone, and increasing work window", () => {
  assert.deepEqual(validatePreferences(validPreferences), {});
});

test("rejects blank names and invalid IANA zones", () => {
  assert.equal(validatePreferences({ ...validPreferences, name: "   " }).name, "Enter your name.");
  assert.equal(validatePreferences({ ...validPreferences, timezone: "Mars/Olympus" }).timezone, "Choose a valid IANA time zone.");
});

test("rejects malformed, equal, or reversed work times", () => {
  assert.equal(validatePreferences({ ...validPreferences, workStart: "8am" }).workStart, "Enter a valid start time.");
  assert.equal(validatePreferences({ ...validPreferences, workStart: "20:00", workEnd: "20:00" }).workEnd, "Work end must be later than work start.");
  assert.equal(validatePreferences({ ...validPreferences, workStart: "21:00", workEnd: "08:00" }).workEnd, "Work end must be later than work start.");
});
