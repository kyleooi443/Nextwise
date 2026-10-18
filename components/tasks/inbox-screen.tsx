"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, ChevronDown, Circle, Clock3, Pencil, Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { LevelTag } from "@/components/level-tag";
import { TaskEditor } from "@/components/tasks/task-editor";
import { formatRelative } from "@/lib/scheduler";
import type { Task } from "@/types/nextwise";

type Filter = "all" | "today" | "upcoming" | "completed" | "overdue" | "blocked";
const filters: { key: Filter; label: string }[] = [{ key: "all", label: "All tasks" }, { key: "today", label: "Today" }, { key: "upcoming", label: "Upcoming" }, { key: "completed", label: "Completed" }, { key: "overdue", label: "Overdue" }, { key: "blocked", label: "Blocked" }];

function matchesFilter(task: Task, filter: Filter): boolean {
  const deadline = task.deadlineAt ? new Date(task.deadlineAt) : undefined;
  const now = new Date();
  if (filter === "all") return task.status !== "completed";
  if (filter === "completed") return task.status === "completed";
  if (filter === "blocked") return task.status === "blocked";
  if (filter === "overdue") return task.status !== "completed" && Boolean(deadline && deadline < now);
  if (filter === "today") return task.status !== "completed" && Boolean(deadline && deadline.toDateString() === now.toDateString());
  return task.status !== "completed" && Boolean(deadline && deadline > now && deadline.toDateString() !== now.toDateString());
}

function TaskRow({ task, onEdit, onComplete, onDelete }: { task: Task; onEdit: () => void; onComplete: () => void; onDelete: () => void }) {
  const { state } = useNextwise();
  const blockedBy = task.dependencies.map((id) => state.tasks.find((item) => item.id === id)).filter((item) => item && item.status !== "completed");
  return <article className={`inbox-row ${task.status === "completed" ? "is-complete" : ""}`}>
    <button className="task-check" onClick={onComplete} aria-label={task.status === "completed" ? `Reopen ${task.title}` : `Complete ${task.title}`}>{task.status === "completed" ? <Check size={15} /> : <Circle size={17} />}</button>
    <div className="inbox-task-main"><button className="inbox-task-title" onClick={onEdit}>{task.title}</button>{task.description && <p>{task.description}</p>}{blockedBy.length > 0 && <span className="dependency-chip">Waiting on {blockedBy[0]?.title}</span>}<div className="inbox-meta"><LevelTag level={task.reasoningLevel} />{task.deadlineAt ? <span className={`tag ${new Date(task.deadlineAt) < new Date() && task.status !== "completed" ? "tag-danger" : ""}`}><Clock3 size={11} /> Due {formatRelative(task.deadlineAt)}</span> : <span className="tag">No deadline</span>}{task.project && <span className="project-label">{task.project}</span>}</div></div>
    <div className="task-effort"><b>{task.remainingMinutes}</b><span>min left</span></div>
    <div className="task-row-actions"><button className="icon-button" onClick={onEdit} aria-label={`Edit ${task.title}`}><Pencil size={15} /></button><button className="icon-button delete-task" onClick={onDelete} aria-label={`Delete ${task.title}`}><Trash2 size={15} /></button></div>
  </article>;
}

export function InboxScreen() {
  const searchParams = useSearchParams();
  const { state, hydrated, updateTask, completeTask, deleteTask } = useNextwise();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("deadline");
  const [reasoning, setReasoning] = useState("any");
  const [effort, setEffort] = useState("any");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Task | undefined>();
  const [captureText, setCaptureText] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    if (!q) return;
    const id = window.setTimeout(() => setQuery(q), 0);
    return () => window.clearTimeout(id);
  }, [searchParams]);

  const visible = useMemo(() => state.tasks.filter((task) => {
    if (!matchesFilter(task, filter)) return false;
    if (query && !`${task.title} ${task.description ?? ""} ${task.project ?? ""}`.toLowerCase().includes(query.toLowerCase())) return false;
    if (reasoning !== "any" && task.reasoningLevel !== Number(reasoning)) return false;
    if (effort === "short" && task.remainingMinutes > 25 || effort === "medium" && (task.remainingMinutes <= 25 || task.remainingMinutes > 60) || effort === "long" && task.remainingMinutes <= 60) return false;
    return true;
  }).sort((a, b) => {
    if (sort === "importance") return b.importance - a.importance;
    if (sort === "effort") return a.remainingMinutes - b.remainingMinutes;
    if (sort === "reasoning") return a.reasoningLevel - b.reasoningLevel;
    if (!a.deadlineAt) return 1;
    if (!b.deadlineAt) return -1;
    return new Date(a.deadlineAt).getTime() - new Date(b.deadlineAt).getTime();
  }), [state.tasks, filter, query, reasoning, effort, sort]);

  function edit(task?: Task, initialText = "") { setEditing(task); setCaptureText(initialText); setEditorOpen(true); }

  if (!hydrated) return <div className="loading-line" role="status">Loading your tasks…</div>;

  return <div className="inbox-screen">
    <div className="page-heading"><div><div className="date-line">Your workload</div><h1>Inbox</h1><p>Keep everything in view. NEXTWISE will help you decide what comes next.</p></div><button className="button button-primary" onClick={() => edit()}><Plus size={16} /> Add task</button></div>
    <form className="quick-capture surface" onSubmit={(event) => { event.preventDefault(); const value = (event.currentTarget.elements.namedItem("quick-task") as HTMLInputElement).value.trim(); if (value) edit(undefined, value); }}><div className="quick-capture-icon"><Plus size={16} /></div><input name="quick-task" aria-label="Quick add a task" placeholder="Add a new task… Try “Review notes tomorrow”" /><span className="capture-voice muted" title="Voice input is not enabled in this prototype">Voice <span aria-hidden="true">⌘</span></span><button type="submit" className="capture-submit" aria-label="Open task editor"><Plus size={17} /></button></form>
    <div className="inbox-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter tasks">{filters.map((item) => <button role="tab" aria-selected={filter === item.key} className={filter === item.key ? "active" : ""} key={item.key} onClick={() => setFilter(item.key)}>{item.label}{item.key === "all" && <span>{state.tasks.filter((task) => task.status !== "completed").length}</span>}</button>)}</div><button className={`button filter-toggle ${filtersOpen ? "is-active" : ""}`} onClick={() => setFiltersOpen((open) => !open)}><SlidersHorizontal size={14} /> Filters <ChevronDown size={13} /></button></div>
    {filtersOpen && <div className="filter-panel surface"><label>Reasoning<select className="field" value={reasoning} onChange={(event) => setReasoning(event.target.value)}><option value="any">Any level</option><option value="1">L1 · Light</option><option value="2">L2 · Moderate</option><option value="3">L3 · Deep</option><option value="4">L4 · Intensive</option></select></label><label>Effort<select className="field" value={effort} onChange={(event) => setEffort(event.target.value)}><option value="any">Any duration</option><option value="short">25 min or less</option><option value="medium">26–60 min</option><option value="long">Over 60 min</option></select></label><label>Sort by<select className="field" value={sort} onChange={(event) => setSort(event.target.value)}><option value="deadline">Deadline</option><option value="importance">Importance</option><option value="effort">Effort</option><option value="reasoning">Reasoning level</option></select></label><button className="button" onClick={() => { setReasoning("any"); setEffort("any"); setSort("deadline"); }}>Clear filters</button></div>}
    <div className="inbox-list-head"><span>{filter === "all" ? "Tasks" : filters.find((item) => item.key === filter)?.label}</span><span>{visible.length} {visible.length === 1 ? "task" : "tasks"}</span></div>
    <section className="inbox-list surface" aria-label="Task list">{visible.length ? visible.map((task) => <TaskRow key={task.id} task={task} onEdit={() => edit(task)} onComplete={() => task.status === "completed" ? updateTask(task.id, { status: "todo", remainingMinutes: task.estimatedMinutes }) : completeTask(task.id)} onDelete={() => deleteTask(task.id)} />) : <div className="empty-inbox"><div className="empty-mark"><Check size={19} /></div><h2>{query ? "No matching tasks" : "Nothing in this view"}</h2><p>{query ? "Try another search or clear the filters." : "Add a task and NEXTWISE will help find a useful first step."}</p>{!query && <button className="button button-primary" onClick={() => edit()}><Plus size={15} /> Add a task</button>}</div>}</section>
    {editorOpen && <TaskEditor key={editing?.id ?? `new-${captureText}`} task={editing} initialText={captureText} onClose={() => { setEditorOpen(false); setEditing(undefined); setCaptureText(""); }} />}
  </div>;
}
