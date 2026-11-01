"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, CheckCircle2, CircleAlert, Clock3, Play, Target } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { LevelTag } from "@/components/level-tag";
import { addDaysToDayKey, dayKeyInTimeZone, formatInTimeZone, localDateTimeToInstant } from "@/lib/date-time";

type Period = "today" | "week";

function formatSessionTime(value: string, period: Period, timeZone: string) {
  const sessionDay = dayKeyInTimeZone(value, timeZone);
  const time = formatInTimeZone(value, timeZone, { hour: "numeric", minute: "2-digit" });
  if (sessionDay === dayKeyInTimeZone(new Date(), timeZone)) return `Today, ${time}`;
  if (period === "today") return time;
  return `${formatInTimeZone(value, timeZone, { weekday: "short", month: "short", day: "numeric" })}, ${time}`;
}

function outcomeLabel(outcome?: string) {
  if (outcome === "completed") return "Completed";
  if (outcome === "partial") return "Partial";
  if (outcome === "blocked") return "Blocked";
  if (outcome === "skipped") return "Skipped";
  return "In progress";
}

export function ReviewScreen() {
  const { state, hydrated } = useNextwise();
  const [period, setPeriod] = useState<Period>("today");
  const now = new Date();
  const timeZone = state.preferences.timezone;
  const todayKey = dayKeyInTimeZone(now, timeZone);
  const startKey = period === "today" ? todayKey : addDaysToDayKey(todayKey, -6);
  const start = localDateTimeToInstant(startKey, "00:00", timeZone);

  const sessions = state.sessions
    .filter((session) => session.endedAt && new Date(session.endedAt) >= start && new Date(session.endedAt) <= now)
    .sort((a, b) => new Date(b.endedAt!).getTime() - new Date(a.endedAt!).getTime());
  const completedTasks = state.tasks.filter((task) => task.status === "completed");
  const focusMinutes = sessions.reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0);
  const measured = sessions.filter((session) => session.outcome === "completed" && session.actualMinutes !== undefined);
  const averageDifference = measured.length
    ? Math.round(measured.reduce((sum, session) => sum + ((session.actualMinutes ?? 0) - session.plannedMinutes), 0) / measured.length)
    : undefined;
  const levelCounts = [1, 2, 3, 4].map((level) => ({
    level,
    count: completedTasks.filter((task) => task.reasoningLevel === level).length,
  }));
  const disruptions = sessions.filter((session) => session.outcome === "skipped" || session.outcome === "blocked");

  if (!hydrated) return <div className="loading-line">Loading your review…</div>;

  return <div className="review-screen">
    <div className="page-heading review-heading">
      <div>
        <div className="date-line">A clear look back</div>
        <h1>Review</h1>
        <p>Notice what moved forward and use it to shape what comes next.</p>
      </div>
      <div className="heading-actions">
        <div className="view-toggle timeline-view-toggle review-period-toggle" role="tablist" aria-label="Review period">
          <button type="button" role="tab" aria-selected={period === "today"} className={period === "today" ? "selected" : ""} onClick={() => setPeriod("today")}>Today</button>
          <button type="button" role="tab" aria-selected={period === "week"} className={period === "week" ? "selected" : ""} onClick={() => setPeriod("week")}>7 days</button>
        </div>
      </div>
    </div>

    <div className="review-period-caption"><CalendarDays size={14} aria-hidden="true" /><span>{period === "today" ? "Focus sessions recorded today" : "Focus sessions recorded in the last seven days"}</span></div>

    <div className="review-metrics">
      <section className="review-metric surface">
        <div className="review-metric-top"><span className="review-metric-icon review-icon-complete"><CheckCircle2 size={16} aria-hidden="true" /></span><span className="review-metric-label">Completed work</span></div>
        <b>{completedTasks.length}</b><small>Tasks completed · all time</small>
      </section>
      <section className="review-metric surface">
        <div className="review-metric-top"><span className="review-metric-icon review-icon-focus"><Clock3 size={16} aria-hidden="true" /></span><span className="review-metric-label">Focus time</span></div>
        <b>{Math.floor(focusMinutes / 60)}h {focusMinutes % 60}m</b><small>{sessions.length} {sessions.length === 1 ? "session" : "sessions"} in this period</small>
      </section>
      <section className="review-metric surface">
        <div className="review-metric-top"><span className="review-metric-icon review-icon-estimate"><Target size={16} aria-hidden="true" /></span><span className="review-metric-label">Time estimate</span></div>
        <b>{averageDifference === undefined ? "—" : `${averageDifference > 0 ? "+" : ""}${averageDifference} min`}</b>
        <small>{averageDifference === undefined ? "Complete a focus session to compare" : "Average actual vs planned time"}</small>
      </section>
      <section className="review-metric surface">
        <div className="review-metric-top"><span className="review-metric-icon review-icon-disruption"><CircleAlert size={16} aria-hidden="true" /></span><span className="review-metric-label">Disruptions</span></div>
        <b>{disruptions.length}</b><small>Skipped or blocked sessions</small>
      </section>
    </div>

    <div className="review-columns">
      <section className="review-panel surface" aria-labelledby="review-completed-title">
        <div className="review-panel-head">
          <div><h2 id="review-completed-title">Completed work</h2><p>Tasks marked complete · all time</p></div>
          <span className="review-count-badge">{completedTasks.length}</span>
        </div>
        {completedTasks.length ? <div className="review-task-list">{completedTasks.map((task) => <div className="review-task" key={task.id}>
          <span className="review-check"><Check size={13} aria-hidden="true" /></span>
          <div className="review-task-copy"><b>{task.title}</b><small>{task.project ?? "Personal"}</small></div>
          <LevelTag level={task.reasoningLevel} />
        </div>)}</div> : <div className="review-empty">
          <span className="review-empty-icon"><CheckCircle2 size={18} aria-hidden="true" /></span>
          <h3>Your progress will show here</h3>
          <p>Mark a task complete to build a record of what you’ve accomplished.</p>
          <Link className="button" href="/inbox">View tasks <ArrowRight size={13} aria-hidden="true" /></Link>
        </div>}
      </section>

      <section className="review-panel surface" aria-labelledby="review-reasoning-title">
        <div className="review-panel-head">
          <div><h2 id="review-reasoning-title">Reasoning mix</h2><p>Completed tasks · all time</p></div>
        </div>
        {completedTasks.length ? <div className="reasoning-bars">{levelCounts.map(({ level, count }) => <div className="reasoning-bar" key={level}>
          <LevelTag level={level as 1 | 2 | 3 | 4} />
          <div className="reasoning-track" role="img" aria-label={`${count} tasks at reasoning level ${level}`}><i style={{ width: `${count / completedTasks.length * 100}%` }} /></div>
          <span>{count}</span>
        </div>)}</div> : <div className="review-reasoning-empty"><p>Reasoning levels will appear once you complete tasks.</p></div>}
        <p className="review-note">Reasoning level describes cognitive demand, separate from deadline and importance.</p>
      </section>
    </div>

    <section className="review-panel surface session-history" aria-labelledby="review-sessions-title">
      <div className="review-panel-head">
        <div><h2 id="review-sessions-title">Focus sessions</h2><p>{period === "today" ? "Your recorded sessions today" : "Your recorded sessions from the last seven days"}</p></div>
        <span className="review-count-badge">{sessions.length}</span>
      </div>
      {sessions.length ? <div className="session-list">{sessions.map((session) => {
        const task = state.tasks.find((item) => item.id === session.taskId);
        return <article className="session-row" key={session.id}>
          <span className={`session-outcome outcome-${session.outcome}`} aria-hidden="true" />
          <div className="session-main"><b>{task?.title ?? "Removed task"}</b><small>{formatSessionTime(session.endedAt!, period, timeZone)} <span aria-hidden="true">·</span> {outcomeLabel(session.outcome)}</small></div>
          <span className="session-duration">{session.actualMinutes ?? session.plannedMinutes}<small>min</small></span>
          <span className="session-planned">Planned {session.plannedMinutes}m</span>
        </article>;
      })}</div> : <div className="review-empty review-session-empty">
        <span className="review-empty-icon"><Play size={17} aria-hidden="true" /></span>
        <h3>No focus sessions in this period</h3>
        <p>Start a focus session to track your time and progress here.</p>
        <Link className="button button-primary" href="/focus"><Play size={13} aria-hidden="true" /> Start a focus session</Link>
      </div>}
    </section>
  </div>;
}
