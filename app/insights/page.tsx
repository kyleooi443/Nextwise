"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Check, Clock3, Quote, Target } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { addDaysToDayKey, dayKeyInTimeZone, localDateTimeToInstant } from "@/lib/date-time";
import { deriveInsightReport, getDailyReflection, type InsightDay, type InsightReport } from "@/lib/insights";

const OUTCOME_LABELS = ["completed", "partial", "blocked", "skipped"] as const;
const OUTCOME_COLORS: Record<(typeof OUTCOME_LABELS)[number], string> = { completed: "#2a9573", partial: "#d68a36", blocked: "#c94d4d", skipped: "#8b929c" };

function durationLabel(minutes?: number) {
  if (minutes === undefined || !minutes) return "0 min";
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h${remainder ? ` ${remainder}m` : ""}` : `${minutes} min`;
}

function FocusChart({ days, rangeDays, totalMinutes }: { days: InsightDay[]; rangeDays: 7 | 30; totalMinutes: number }) {
  const max = Math.max(15, Math.ceil(Math.max(...days.map((day) => day.minutes), 0) / 15) * 15);
  const y = (value: number) => 172 - (value / max) * 142;
  const slot = 640 / days.length;
  const barWidth = Math.min(rangeDays === 7 ? 44 : 13, slot * 0.58);
  const labelEvery = rangeDays === 7 ? 1 : 5;
  const values = days.map((day) => `${day.dateKey}: ${day.minutes} minutes across ${day.sessionCount} sessions`).join("; ");
  return <section className="insights-chart surface" aria-labelledby="focus-chart-title">
    <div className="insights-chart-head"><div><span className="insights-chart-icon"><Clock3 size={16} /></span><div><h2 id="focus-chart-title">Focus time by day</h2><p>Actual minutes from ended focus sessions</p></div></div><b>{durationLabel(totalMinutes)}</b></div>
    {totalMinutes === 0 && <p className="insights-chart-empty">No focus minutes recorded in this range. The daily baseline is shown below. <Link href="/focus">Start a focus session</Link></p>}
    <div className="insights-svg-wrap"><svg viewBox="0 0 700 220" role="img" aria-labelledby="focus-svg-title focus-svg-desc" preserveAspectRatio="none">
      <title id="focus-svg-title">Daily focus minutes</title><desc id="focus-svg-desc">{values}</desc>
      {[0, .5, 1].map((fraction) => <g key={fraction}><line x1="42" x2="684" y1={172 - 142 * fraction} y2={172 - 142 * fraction} className="insights-grid-line" /><text x="35" y={176 - 142 * fraction} textAnchor="end" className="insights-axis-label">{Math.round(max * fraction)}</text></g>)}
      {days.map((day, index) => {
        const x = 44 + index * slot + (slot - barWidth) / 2;
        const barHeight = day.minutes ? Math.max(2, 172 - y(day.minutes)) : 0;
        const showTick = rangeDays === 7 || index % labelEvery === 0 || index === days.length - 1;
        const tick = rangeDays === 7 ? day.label.slice(0, 3) : `${day.dateKey.slice(5, 7)}/${day.dateKey.slice(8)}`;
        return <g key={day.dateKey}><rect className="insights-bar" x={x} y={172 - barHeight} width={barWidth} height={barHeight} rx="3"><title>{`${day.dateKey}: ${day.minutes} min · ${day.sessionCount} ${day.sessionCount === 1 ? "session" : "sessions"}`}</title></rect>{showTick && <text x={x + barWidth / 2} y="196" textAnchor="middle" className="insights-day-label">{tick}</text>}</g>;
      })}
    </svg></div>
    <ul className="sr-only">{days.map((day) => <li key={day.dateKey}>{day.dateKey}: {day.minutes} focus minutes from {day.sessionCount} sessions</li>)}</ul>
  </section>;
}

function OutcomeChart({ report }: { report: InsightReport }) {
  const max = Math.max(1, ...OUTCOME_LABELS.map((key) => report.outcomes[key]));
  return <section className="insights-chart surface" aria-labelledby="outcome-chart-title">
    <div className="insights-chart-head"><div><span className="insights-chart-icon outcomes-icon"><BarChart3 size={16} /></span><div><h2 id="outcome-chart-title">Session outcomes</h2><p>Recorded results in this range</p></div></div><b>{report.metrics.endedSessions} total</b></div>
    {!report.metrics.endedSessions && <p className="insights-chart-empty">Outcome counts begin after you finish a focus session. <Link href="/focus">Start a focus session</Link></p>}
    <div className="outcome-chart-list" role="img" aria-label={OUTCOME_LABELS.map((key) => `${key}: ${report.outcomes[key]}`).join(", ")}>
      {OUTCOME_LABELS.map((key) => <div className="outcome-chart-row" key={key}><span className="outcome-chart-name"><i style={{ background: OUTCOME_COLORS[key] }} />{key}</span><div className="outcome-track" aria-hidden="true"><i style={{ width: `${(report.outcomes[key] / max) * 100}%`, background: OUTCOME_COLORS[key] }} /></div><b>{report.outcomes[key]}</b></div>)}
    </div>
    <ul className="sr-only">{OUTCOME_LABELS.map((key) => <li key={key}>{key}: {report.outcomes[key]} sessions</li>)}</ul>
  </section>;
}

export default function InsightsPage() {
  const { state, hydrated } = useNextwise();
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);
  const [now, setNow] = useState(() => new Date());
  const timeZone = state.preferences.timezone;
  useEffect(() => {
    const currentDay = dayKeyInTimeZone(new Date(), timeZone);
    const nextDay = addDaysToDayKey(currentDay, 1);
    const nextMidnight = localDateTimeToInstant(nextDay, "00:00", timeZone);
    const timer = window.setTimeout(() => setNow(new Date()), Math.max(1000, nextMidnight.getTime() - Date.now() + 1000));
    return () => window.clearTimeout(timer);
  }, [timeZone, now]);
  if (!hydrated) return <div className="loading-line">Loading your insights…</div>;
  const report = deriveInsightReport(state, rangeDays, now);
  const reflection = getDailyReflection(now, timeZone);
  const openTaskCount = state.tasks.filter((task) => task.status !== "completed").length;
  return <div className="insights-screen">
    <div className="page-heading insights-heading"><div><div className="date-line">Patterns from your own activity</div><h1>Insights</h1><p>Useful context from focus sessions recorded on this device.</p></div>
      <div className="insights-range" role="group" aria-label="Insights date range"><button type="button" aria-pressed={rangeDays === 7} className={rangeDays === 7 ? "selected" : ""} onClick={() => setRangeDays(7)}>7 days</button><button type="button" aria-pressed={rangeDays === 30} className={rangeDays === 30 ? "selected" : ""} onClick={() => setRangeDays(30)}>30 days</button></div>
    </div>
    <p className="insights-period">Last {rangeDays} days · ending today in {timeZone}</p>
    <div className="insights-metrics" aria-label="Summary metrics">
      <article className="insights-metric surface"><span className="insights-metric-icon metric-focus"><Clock3 size={16} /></span><small>Focus time</small><b>{durationLabel(report.metrics.focusMinutes)}</b><span>actual recorded minutes</span></article>
      <article className="insights-metric surface"><span className="insights-metric-icon metric-sessions"><BarChart3 size={16} /></span><small>Ended sessions</small><b>{report.metrics.endedSessions}</b><span>in this date range</span></article>
      <article className="insights-metric surface"><span className="insights-metric-icon metric-complete"><Check size={16} /></span><small>Completed</small><b>{report.metrics.completedSessions}</b><span>sessions marked complete</span></article>
      <article className="insights-metric surface"><span className="insights-metric-icon metric-average"><Target size={16} /></span><small>Average session</small><b>{durationLabel(report.metrics.averageActualMinutes)}</b><span>{report.metrics.averageActualMinutes === undefined ? "no duration recorded" : "per session with actual time"}</span></article>
    </div>
    <div className="insights-charts"><FocusChart days={report.focusByDay} rangeDays={rangeDays} totalMinutes={report.metrics.focusMinutes} /><OutcomeChart report={report} /></div>
    <section className="insights-reflection surface"><span className="reflection-icon"><Quote size={18} /></span><div><span className="eyebrow">A thought for today</span><blockquote>{reflection.text}</blockquote><small>{reflection.dayKey}</small></div></section>
    <section className="insights-suggestions-section">
      <div className="insights-section-head"><div><h2>Suggestions</h2><p>Small actions grounded in this date range.</p></div><span>{report.suggestions.length} actions</span></div>
      {report.suggestions.length ? <div className="insights-suggestions">{report.suggestions.map((suggestion) => <article className="insights-suggestion surface" key={suggestion.id}><span className="suggestion-mark"><ArrowRight size={16} /></span><div><h3>{suggestion.title}</h3><p>{suggestion.evidence}</p></div><Link href={suggestion.href} className="button">{suggestion.actionLabel}<ArrowRight size={14} /></Link></article>)}</div> : <article className="insights-no-suggestions surface"><h3>{openTaskCount ? "Keep building a useful sample" : "Your workspace is clear"}</h3><p>{openTaskCount ? `${report.eligibleSampleCount} eligible sessions are recorded. Comparative suggestions appear after five.` : "There are no open tasks to act on right now. Add your next task whenever you are ready."}</p><Link href={openTaskCount ? "/focus" : "/inbox"} className="button">{openTaskCount ? "Start a focus session" : "Open Inbox"}<ArrowRight size={14} /></Link></article>}
      {!openTaskCount && <article className="insights-no-tasks surface"><h3>No open tasks</h3><p>Your current tasks are complete. Add another task when you are ready.</p><Link href="/inbox" className="button">Add a task <ArrowRight size={14} /></Link></article>}
    </section>
    <p className="insights-method">Insights use completed session records and task details stored in this browser. No activity is generated or sent elsewhere.</p>
  </div>;
}
