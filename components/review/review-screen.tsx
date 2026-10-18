"use client";

import { useState } from "react";
import { Check, Clock3, CircleAlert, Target } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { LevelTag } from "@/components/level-tag";

type Period = "today" | "week";

export function ReviewScreen() {
  const { state, hydrated } = useNextwise();
  const [period, setPeriod] = useState<Period>("today");
  const now = new Date();
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  else { start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0); }
  const sessions = state.sessions.filter((session) => session.endedAt && new Date(session.endedAt) >= start && new Date(session.endedAt) <= now);
  const completedTasks = state.tasks.filter((task) => task.status === "completed");
  const focusMinutes = sessions.reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0);
  const measured = sessions.filter((session) => session.outcome === "completed" && session.actualMinutes !== undefined);
  const averageDifference = measured.length ? Math.round(measured.reduce((sum, session) => sum + ((session.actualMinutes ?? 0) - session.plannedMinutes), 0) / measured.length) : undefined;
  const levelCounts = [1, 2, 3, 4].map((level) => ({ level, count: completedTasks.filter((task) => task.reasoningLevel === level).length }));
  const disruptions = sessions.filter((session) => session.outcome === "skipped" || session.outcome === "blocked");

  if (!hydrated) return <div className="loading-line">Loading your review…</div>;

  return <div className="review-screen">
    <div className="page-heading"><div><div className="date-line">A clear look back</div><h1>Review</h1><p>Notice what moved forward and use it to shape what comes next.</p></div><div className="view-toggle" role="tablist" aria-label="Review period"><button role="tab" aria-selected={period === "today"} className={period === "today" ? "selected" : ""} onClick={() => setPeriod("today")}>Today</button><button role="tab" aria-selected={period === "week"} className={period === "week" ? "selected" : ""} onClick={() => setPeriod("week")}>7 days</button></div></div>
    <div className="review-metrics"><section className="review-metric surface"><span><Check size={15} /> Completed</span><b>{completedTasks.length}</b><small>Tasks marked complete</small></section><section className="review-metric surface"><span><Clock3 size={15} /> Focus time</span><b>{Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m</b><small>{sessions.length} recorded sessions</small></section><section className="review-metric surface"><span><Target size={15} /> Estimation</span><b>{averageDifference === undefined ? "—" : `${averageDifference > 0 ? "+" : ""}${averageDifference} min`}</b><small>{averageDifference === undefined ? "Record a completed session to compare" : "Average actual time vs planned"}</small></section><section className="review-metric surface"><span><CircleAlert size={15} /> Disruptions</span><b>{disruptions.length}</b><small>Skipped or blocked sessions</small></section></div>
    <div className="review-columns"><section className="review-panel surface"><div className="review-panel-head"><div><h2>Completed work</h2><p>Tasks you marked complete</p></div><span>{completedTasks.length}</span></div>{completedTasks.length ? <div className="review-task-list">{completedTasks.map((task) => <div className="review-task" key={task.id}><span className="review-check"><Check size={13} /></span><div><b>{task.title}</b><small>{task.project ?? "Personal"}</small></div><LevelTag level={task.reasoningLevel} /></div>)}</div> : <div className="review-empty"><p>No tasks marked complete {period === "today" ? "today" : "in this period"}. Your review will fill in as you record progress.</p></div>}</section>
      <section className="review-panel surface"><div className="review-panel-head"><div><h2>Reasoning mix</h2><p>Across completed tasks</p></div></div><div className="reasoning-bars">{levelCounts.map(({ level, count }) => <div className="reasoning-bar" key={level}><LevelTag level={level} /><div><i style={{ width: `${completedTasks.length ? count / completedTasks.length * 100 : 0}%` }} /></div><span>{count}</span></div>)}</div><p className="review-note">Reasoning level describes cognitive demand, separate from deadline and importance.</p></section>
    </div>
    <section className="review-panel surface session-history"><div className="review-panel-head"><div><h2>Focus sessions</h2><p>{period === "today" ? "Recorded today" : "Recorded in the last seven days"}</p></div><span>{sessions.length}</span></div>{sessions.length ? sessions.map((session) => { const task = state.tasks.find((item) => item.id === session.taskId); return <div className="session-row" key={session.id}><span className={`session-outcome outcome-${session.outcome}`} /> <div><b>{task?.title ?? "Removed task"}</b><small>{session.endedAt ? new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(session.endedAt)) : "In progress"} · {session.actualMinutes ?? session.plannedMinutes} min · {session.outcome}</small></div><span className="session-planned">Planned {session.plannedMinutes}m</span></div>; }) : <div className="review-empty"><p>No focus sessions have been recorded in this period.</p></div>}</section>
  </div>;
}
