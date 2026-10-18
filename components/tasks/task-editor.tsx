"use client";

import { FormEvent, useState } from "react";
import { Check, ChevronDown, Mic, X } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import type { Task, TaskDraft } from "@/types/nextwise";

function localDate(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}-${`${date.getDate()}`.padStart(2, "0")}`;
}

function parseCapture(input: string): { title: string; deadlineAt?: string } {
  const text = input.trim();
  const tomorrow = /\btomorrow\b/i.test(text);
  const today = /\btoday\b/i.test(text);
  const inDays = text.match(/\bin\s+(\d+)\s+days?\b/i);
  const date = new Date();
  let found = false;
  if (tomorrow) { date.setDate(date.getDate() + 1); found = true; }
  else if (inDays) { date.setDate(date.getDate() + Number(inDays[1])); found = true; }
  else if (today) found = true;
  if (found) date.setHours(23, 59, 0, 0);
  const title = text.replace(/\b(tomorrow|today|in\s+\d+\s+days?)\b/ig, "").replace(/\s+/g, " ").replace(/\s+([,.!?])/g, "$1").trim();
  return { title: title || text, deadlineAt: found ? date.toISOString() : undefined };
}

export function TaskEditor({ task, initialText = "", onClose }: { task?: Task; initialText?: string; onClose: () => void }) {
  const { state, addTask, updateTask } = useNextwise();
  const [quick, setQuick] = useState(task?.title ?? initialText);
  const [title, setTitle] = useState(task?.title ?? parseCapture(initialText).title);
  const [description, setDescription] = useState(task?.description ?? "");
  const [deadline, setDeadline] = useState(localDate(task?.deadlineAt));
  const [importance, setImportance] = useState(task?.importance ?? 0.7);
  const [estimate, setEstimate] = useState(task?.estimatedMinutes ?? 25);
  const [splittable, setSplittable] = useState(task?.splittable ?? true);
  const [level, setLevel] = useState<number>(task?.reasoningLevel ?? 2);
  const [project, setProject] = useState(task?.project ?? "");
  const [microStep, setMicroStep] = useState(task?.microStep ?? "");
  const [dependency, setDependency] = useState(task?.dependencies[0] ?? "");
  const [detailsOpen, setDetailsOpen] = useState(Boolean(task));
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = parseCapture(title || quick);
    const cleanTitle = (title || parsed.title).trim();
    if (!cleanTitle) { setError("Add a task name to continue."); return; }
    const deadlineAt = deadline ? new Date(`${deadline}T23:59:00`).toISOString() : parsed.deadlineAt;
    const draft: TaskDraft = {
      title: cleanTitle,
      description: description.trim() || undefined,
      project: project.trim() || undefined,
      deadlineAt,
      importance: Number(importance),
      estimatedMinutes: Math.max(5, Number(estimate) || 25),
      remainingMinutes: task?.remainingMinutes ?? Math.max(5, Number(estimate) || 25),
      splittable,
      reasoningLevel: Number(level) as 1 | 2 | 3 | 4,
      ease: task?.ease ?? 0.65,
      microStep: microStep.trim() || `Open what you need and spend the first ${Math.min(10, Number(estimate) || 25)} minutes getting started.`,
      dependencies: dependency ? [dependency] : [],
    };
    if (task) updateTask(task.id, { ...draft, dependencies: draft.dependencies ?? [] });
    else addTask(draft);
    onClose();
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="task-modal surface" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
    <div className="modal-head"><div><span className="eyebrow">{task ? "Edit task" : "Quick capture"}</span><h2 id="task-modal-title">{task ? "Update task details" : "Add a task"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close task editor"><X size={18} /></button></div>
    <form onSubmit={submit}>
      {!task && <label className="form-label">What do you need to do?<div className="capture-row"><input className="field" value={quick} onChange={(event) => { const parsed = parseCapture(event.target.value); setQuick(event.target.value); setTitle(parsed.title); setDeadline(parsed.deadlineAt ? localDate(parsed.deadlineAt) : ""); }} placeholder="e.g. Finish calculus assignment tomorrow" autoFocus /><button type="button" className="voice-button" title="Voice capture is not enabled in this prototype" aria-label="Voice capture unavailable"><Mic size={16} /></button></div><small className="form-hint">You can include “today,” “tomorrow,” or “in 3 days.” Detected details stay editable.</small></label>}
      <label className="form-label">Task name<input className="field" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Name the task" /></label>
      <button type="button" className="details-toggle" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}>Task details <ChevronDown size={15} className={detailsOpen ? "rotated" : ""} /></button>
      {detailsOpen && <div className="form-grid">
        <label className="form-label">Deadline <span className="optional">Optional</span><input className="field" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
        <label className="form-label">Reasoning level<select className="field" value={level} onChange={(event) => setLevel(Number(event.target.value))}><option value={1}>L1 — Light</option><option value={2}>L2 — Moderate</option><option value={3}>L3 — Deep</option><option value={4}>L4 — Intensive</option></select></label>
        <label className="form-label">Estimated effort <span className="input-suffix"><input className="field" type="number" min="5" max="600" step="5" value={estimate} onChange={(event) => setEstimate(Number(event.target.value))} /><span>min</span></span></label>
        <label className="form-label">Importance<select className="field" value={importance} onChange={(event) => setImportance(Number(event.target.value))}><option value={0.35}>Low</option><option value={0.65}>Normal</option><option value={0.85}>High</option><option value={1}>Critical</option></select></label>
        <label className="form-label">Project <span className="optional">Optional</span><input className="field" value={project} onChange={(event) => setProject(event.target.value)} placeholder="Project name" /></label>
        <label className="form-label">Blocked by <span className="optional">Optional</span><select className="field" value={dependency} onChange={(event) => setDependency(event.target.value)}><option value="">No dependency</option>{state.tasks.filter((item) => item.id !== task?.id && item.status !== "completed").map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
        <label className="form-label full-width">First step<input className="field" value={microStep} onChange={(event) => setMicroStep(event.target.value)} placeholder="A small action that helps you begin" /></label>
        <label className="settings-checkbox form-split-option full-width"><input type="checkbox" checked={splittable} onChange={(event) => setSplittable(event.target.checked)} /><span><b>Allow shorter focus blocks</b><small>NEXTWISE can schedule part of this task when the full estimate does not fit.</small></span></label>
        <label className="form-label full-width">Notes <span className="optional">Optional</span><textarea className="field textarea" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Add context or useful links" rows={3} /></label>
      </div>}
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="button" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Check size={15} />{task ? "Save changes" : "Add task"}</button></div>
    </form>
  </section></div>;
}
