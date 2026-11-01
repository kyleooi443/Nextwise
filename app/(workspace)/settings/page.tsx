"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";

import { FormEvent, useMemo, useState } from "react";
import { Check, RotateCcw, Save, Settings2 } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { validatePreferences } from "@/lib/settings-validation";
import type { UserPreferences } from "@/types/nextwise";

export default function SettingsPage() {
  const { state, hydrated, setPreferences, resetDemo, storageWarning } = useNextwise();
  const [draft, setDraft] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");
  const values = draft ?? state.preferences;
  const errors = useMemo(() => validatePreferences(values), [values]);
  const dirty = draft !== null && Object.keys(draft).some((key) => draft[key as keyof UserPreferences] !== state.preferences[key as keyof UserPreferences]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShowErrors(true);
    if (!dirty || Object.keys(errors).length) return;
    setPreferences({ ...values, name: values.name.trim() });
    setDraft(null);
    setShowErrors(false);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2400);
  }
  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    setDraft((current) => ({ ...(current ?? state.preferences), [key]: value }));
    setSaved(false);
    setShowErrors(true);
  }
  function fieldError(key: keyof typeof errors) { return showErrors ? errors[key] : undefined; }
  if (!hydrated) return <div className="loading-line">Loading settings…</div>;
  return <div className="settings-screen">
    <div className="page-heading"><div><div className="date-line">Your workspace</div><h1>Settings</h1><p>Set the context NEXTWISE uses to make practical recommendations.</p></div></div>
    <form className="settings-layout" onSubmit={submit} noValidate>
      <nav className="settings-nav" aria-label="Settings sections"><a href="#profile" className={activeSection === "profile" ? "selected" : ""} aria-current={activeSection === "profile" ? "location" : undefined} onClick={() => setActiveSection("profile")}><Settings2 size={15} /> Personal</a><a href="#schedule" className={activeSection === "schedule" ? "selected" : ""} aria-current={activeSection === "schedule" ? "location" : undefined} onClick={() => setActiveSection("schedule")}>Availability</a><a href="#display" className={activeSection === "display" ? "selected" : ""} aria-current={activeSection === "display" ? "location" : undefined} onClick={() => setActiveSection("display")}>Display</a><a href="#data" className={activeSection === "data" ? "selected" : ""} aria-current={activeSection === "data" ? "location" : undefined} onClick={() => setActiveSection("data")}>Data</a></nav>
      <div className="settings-content">
        <section className="settings-section surface" id="profile"><div className="settings-section-head"><div><h2>Personal details</h2><p>Used to personalize your workspace greeting.</p></div></div>
          <label className="settings-field" htmlFor="settings-name">Name<input id="settings-name" className="field" value={values.name} onChange={(event) => update("name", event.target.value)} aria-invalid={Boolean(fieldError("name"))} aria-describedby={fieldError("name") ? "settings-name-error" : undefined} />{fieldError("name") && <small className="field-error" id="settings-name-error">{fieldError("name")}</small>}</label>
          <label className="settings-field" htmlFor="settings-timezone">Time zone<input id="settings-timezone" className="field" list="settings-timezones" value={values.timezone} onChange={(event) => update("timezone", event.target.value)} aria-invalid={Boolean(fieldError("timezone"))} aria-describedby={fieldError("timezone") ? "settings-timezone-error" : undefined} /><datalist id="settings-timezones">{["Asia/Manila", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney", "UTC"].map((timezone) => <option key={timezone} value={timezone} />)}</datalist>{fieldError("timezone") && <small className="field-error" id="settings-timezone-error">{fieldError("timezone")}</small>}<small>Enter an IANA time zone, such as Asia/Manila.</small></label>
        </section>
        <section className="settings-section surface" id="schedule"><div className="settings-section-head"><div><h2>Availability</h2><p>Fixed events remain protected when focus blocks move.</p></div></div>
          <div className="settings-two-col"><label className="settings-field" htmlFor="settings-start">Work starts<input id="settings-start" type="time" className="field" value={values.workStart} onChange={(event) => update("workStart", event.target.value)} aria-invalid={Boolean(fieldError("workStart"))} aria-describedby={fieldError("workStart") ? "settings-start-error" : undefined} />{fieldError("workStart") && <small className="field-error" id="settings-start-error">{fieldError("workStart")}</small>}</label><label className="settings-field" htmlFor="settings-end">Work ends<input id="settings-end" type="time" className="field" value={values.workEnd} onChange={(event) => update("workEnd", event.target.value)} aria-invalid={Boolean(fieldError("workEnd"))} aria-describedby={fieldError("workEnd") ? "settings-end-error" : undefined} />{fieldError("workEnd") && <small className="field-error" id="settings-end-error">{fieldError("workEnd")}</small>}</label></div>
          <label className="settings-field" htmlFor="settings-minutes">Available focus time<select id="settings-minutes" className="field" value={values.availableMinutes} onChange={(event) => update("availableMinutes", Number(event.target.value))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2+ hours</option></select><small>This setting affects task fit. Urgent work remains visible when it does not fit.</small></label>
          <label className="settings-field" htmlFor="settings-energy">Default energy<select id="settings-energy" className="field" value={values.energy} onChange={(event) => update("energy", event.target.value as UserPreferences["energy"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label>
        </section>
        <section className="settings-section surface" id="display"><div className="settings-section-head"><div><h2>Display</h2><p>Choose a comfortable reading mode.</p></div></div><label className="settings-field" htmlFor="settings-theme">Theme<select id="settings-theme" className="field" value={values.theme} onChange={(event) => update("theme", event.target.value as UserPreferences["theme"])}><option value="system">Match device</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="settings-checkbox"><input type="checkbox" checked={values.contextPanelOpen} onChange={(event) => update("contextPanelOpen", event.target.checked)} /><span><b>Show context panels</b><small>Keep schedule and deadline details alongside Today.</small></span></label></section>
        <section className="settings-section surface" id="data"><div className="settings-section-head"><div><h2>Local demo data</h2><p>Your tasks and preferences are stored in this browser only.</p></div></div><div className="data-status"><span className={`status-dot ${storageWarning ? "warn" : ""}`} /><span>{storageWarning ? "Browser storage is unavailable" : "Saved on this device"}</span></div><button type="button" className="button" onClick={() => { if (window.confirm("Reset tasks, sessions, and preferences to the NEXTWISE demo data?")) { resetDemo(); setDraft(null); setShowErrors(false); setSaved(false); } }}><RotateCcw size={14} /> Reset demo data</button><div className="settings-signout"><SignOutButton /></div></section>
        <div className="settings-save-row"><span role="status" aria-live="polite">{saved ? <><Check size={14} /> Preferences saved</> : dirty ? "Unsaved changes" : "All changes are saved."}</span><button className="button button-primary" type="submit" disabled={!dirty || Object.keys(errors).length > 0}><Save size={14} /> Save changes</button></div>
      </div>
    </form>
  </div>;
}
