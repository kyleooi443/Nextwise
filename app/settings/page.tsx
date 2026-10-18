"use client";

import { FormEvent, useState } from "react";
import { Check, RotateCcw, Save, Settings2 } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import type { UserPreferences } from "@/types/nextwise";

export default function SettingsPage() {
  const { state, hydrated, setPreferences, resetDemo, storageWarning } = useNextwise();
  const [draft, setDraft] = useState<UserPreferences | null>(null);
  const [saved, setSaved] = useState(false);
  const values = draft ?? state.preferences;
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPreferences(values); setSaved(true); window.setTimeout(() => setSaved(false), 2400); }
  function update<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) { setDraft((current) => ({ ...(current ?? state.preferences), [key]: value })); }
  if (!hydrated) return <div className="loading-line">Loading settings…</div>;
  return <div className="settings-screen">
    <div className="page-heading"><div><div className="date-line">Your workspace</div><h1>Settings</h1><p>Set the context NEXTWISE uses to make practical recommendations.</p></div></div>
    <form className="settings-layout" onSubmit={submit}>
      <nav className="settings-nav" aria-label="Settings sections"><a href="#profile" className="selected"><Settings2 size={15} /> Personal</a><a href="#schedule">Availability</a><a href="#display">Display</a><a href="#data">Data</a></nav>
      <div className="settings-content">
        <section className="settings-section surface" id="profile"><div className="settings-section-head"><div><h2>Personal details</h2><p>Used to personalize your workspace greeting.</p></div></div><label className="settings-field">Name<input className="field" value={values.name} onChange={(event) => update("name", event.target.value)} /></label><label className="settings-field">Timezone<select className="field" value={values.timezone} onChange={(event) => update("timezone", event.target.value)}>{[values.timezone, "Asia/Manila", "America/Los_Angeles", "America/New_York", "Europe/London", "UTC"].filter((value, index, array) => array.indexOf(value) === index).map((timezone) => <option key={timezone} value={timezone}>{timezone}</option>)}</select></label></section>
        <section className="settings-section surface" id="schedule"><div className="settings-section-head"><div><h2>Availability</h2><p>Fixed events remain protected when focus blocks move.</p></div></div><div className="settings-two-col"><label className="settings-field">Work starts<input type="time" className="field" value={values.workStart} onChange={(event) => update("workStart", event.target.value)} /></label><label className="settings-field">Work ends<input type="time" className="field" value={values.workEnd} onChange={(event) => update("workEnd", event.target.value)} /></label></div><label className="settings-field">Available focus time<select className="field" value={values.availableMinutes} onChange={(event) => update("availableMinutes", Number(event.target.value))}><option value={15}>15 minutes</option><option value={30}>30 minutes</option><option value={60}>1 hour</option><option value={120}>2+ hours</option></select><small>This setting affects task fit. Urgent work remains visible when it does not fit.</small></label><label className="settings-field">Default energy<select className="field" value={values.energy} onChange={(event) => update("energy", event.target.value as UserPreferences["energy"])}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></label></section>
        <section className="settings-section surface" id="display"><div className="settings-section-head"><div><h2>Display</h2><p>Choose a comfortable reading mode.</p></div></div><label className="settings-field">Theme<select className="field" value={values.theme} onChange={(event) => update("theme", event.target.value as UserPreferences["theme"])}><option value="system">Match device</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label className="settings-checkbox"><input type="checkbox" checked={values.contextPanelOpen} onChange={(event) => update("contextPanelOpen", event.target.checked)} /><span><b>Show context panels</b><small>Keep schedule and deadline details alongside Today.</small></span></label></section>
        <section className="settings-section surface" id="data"><div className="settings-section-head"><div><h2>Local demo data</h2><p>Your tasks and preferences are stored in this browser only.</p></div></div><div className="data-status"><span className={`status-dot ${storageWarning ? "warn" : ""}`} /><span>{storageWarning ? "Browser storage is unavailable" : "Saved on this device"}</span></div><button type="button" className="button" onClick={() => { if (window.confirm("Reset tasks, sessions, and preferences to the NEXTWISE demo data?")) resetDemo(); }}><RotateCcw size={14} /> Reset demo data</button></section>
        <div className="settings-save-row"><span role="status">{saved ? <><Check size={14} /> Preferences saved</> : "Changes are saved when you apply them."}</span><button className="button button-primary" type="submit"><Save size={14} /> Save changes</button></div>
      </div>
    </form>
  </div>;
}
