"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarDays, Check, ChevronRight, Circle, Clock3, Eye, EyeOff, MoreHorizontal, Play, RefreshCw, SlidersHorizontal, TriangleAlert, Undo2, Zap } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { LevelTag } from "@/components/level-tag";
import { formatInTimeZone } from "@/lib/date-time";
import { formatRelative, recommendNext } from "@/lib/scheduler";
import type { Task } from "@/types/nextwise";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function shortTime(value: string, timeZone: string) {
  return formatInTimeZone(value, timeZone, { hour: "numeric", minute: "2-digit" });
}

export function TodayScreen() {
  const router = useRouter();
  const { state, hydrated, storageWarning, setPreferences, setRecommendationOverride, setSelectedTask, startFocus, snoozeTask, blockTask, completeTask, acceptRevision, undoLatestRevision } = useNextwise();
  const [whyOpen, setWhyOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(true);
  const now = new Date();
  const timeZone = state.preferences.timezone;
  const dateText = formatInTimeZone(now, timeZone, { weekday: "short", month: "short", day: "numeric" });
  const localHour = Number(new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", hourCycle: "h23" }).format(now));
  const result = useMemo(() => recommendNext(state), [state]);
  const override = result.ranked.find((item) => item.taskId === state.recommendationOverrideId);
  const recommendation = override ?? result.ranked[0];
  const task = state.tasks.find((item) => item.id === recommendation?.taskId);
  const alternatives = result.ranked.filter((item) => item.taskId !== recommendation?.taskId).slice(0, 3);
  const name = state.preferences.name.split(" ")[0] || "there";
  const completed = state.tasks.filter((item) => item.status === "completed").length;
  const total = state.tasks.length;
  const completedMinutes = state.sessions.reduce((sum, session) => sum + (session.actualMinutes ?? 0), 0);
  const openMinutes = state.preferences.availableMinutes;

  function start(minutes = recommendation?.durationMinutes ?? 25, chosenTask: Task | undefined = task) {
    if (!chosenTask) return;
    setSelectedTask(chosenTask.id);
    startFocus(chosenTask.id, minutes);
    router.push("/focus");
  }

  function switchTask() {
    if (alternatives[0]) setRecommendationOverride(alternatives[0].taskId);
    else setRecommendationOverride(undefined);
  }

  function showTask(taskId: string) {
    const selected = state.tasks.find((item) => item.id === taskId);
    if (selected) {
      setSelectedTask(selected.id);
      setRecommendationOverride(selected.id);
    }
  }

  if (!hydrated) return <div className="loading-line" role="status">Loading your plan…</div>;

  return <div className="today-screen">
    <div className="page-heading today-heading">
      <div><div className="date-line">{dateText}</div><h1>{greeting(localHour)}, {name}.</h1><p>Here’s what makes sense to work on next.</p></div>
      <div className="heading-actions"><button className="button desktop-only" onClick={() => router.push("/focus")}><Zap size={15} /> Focus mode</button><button className="icon-button desktop-only" aria-label="Show recommendation factors" onClick={() => setWhyOpen((open) => !open)}><SlidersHorizontal size={16} /></button></div>
    </div>

    {storageWarning && <div className="storage-warning" role="status">Changes are available for this session, but browser storage could not be read or saved.</div>}

    <div className={`today-grid ${state.preferences.contextPanelOpen ? "" : "context-closed"}`}>
      <section className="today-main-column">
        <section className="recommendation surface" aria-labelledby="next-action-title">
          <div className="recommendation-topline"><span className="recommendation-label">Next best action</span><button className="icon-button" aria-label="Show recommendation factors" aria-expanded={whyOpen} onClick={() => setWhyOpen((open) => !open)}><Eye size={16} /></button></div>
          {task && recommendation ? <>
            <div className="recommendation-title-row"><h2 id="next-action-title">{task.title}</h2><span className="duration"><Clock3 size={16} /> {recommendation.durationMinutes} min</span></div>
            <div className="task-meta"><LevelTag level={task.reasoningLevel} />{task.importance >= 0.8 && <span className="tag tag-danger">High importance</span>}{task.deadlineAt && <span className="tag">Due {formatRelative(task.deadlineAt, now, timeZone)}</span>}{!task.deadlineAt && <span className="tag">No deadline</span>}</div>
            <p className="recommendation-copy">{recommendation.explanation}</p>
            <button className="micro-step" onClick={() => start(recommendation.durationMinutes, task)}><span className="micro-check"><Circle size={16} /></span><span><small>First step</small><b>{task.microStep}</b></span><ChevronRight size={18} /></button>
            {whyOpen && <div className="why-panel"><div className="why-heading"><div><b>Why this task?</b><p>Factors used by the recommendation</p></div><button className="icon-button" onClick={() => setWhyOpen(false)} aria-label="Hide recommendation factors"><EyeOff size={15} /></button></div><div className="factor-list">{recommendation.factors.filter((factor) => factor.key !== "penalty" || factor.points < 0).map((factor) => <div className="factor-row" key={factor.key}><span>{factor.label}</span><span className="factor-track"><i style={{ width: `${Math.max(4, factor.value * 100)}%` }} /></span><b>{factor.reason}</b></div>)}</div><p className="factor-footnote">This ranking uses a fixed, editable scoring model. It does not estimate confidence.</p></div>}
            <div className="action-row"><button className="button button-primary start-button" onClick={() => start()}><Play size={15} fill="currentColor" /> Start focus</button><button className="button" onClick={switchTask} disabled={!alternatives.length}><RefreshCw size={14} /> Switch</button><button className="button" onClick={() => snoozeTask(task.id)}><Clock3 size={14} /> Snooze</button><button className="button blocked-action" onClick={() => blockTask(task.id)}><TriangleAlert size={14} /> Blocked</button><button className="complete-action" onClick={() => completeTask(task.id)}><Check size={15} /> Complete</button></div>
          </> : <div className="empty-recommendation"><div className="empty-mark"><Check size={21} /></div><h2>You’re clear for now.</h2><p>{result.unavailable.length ? `${result.unavailable.length} task${result.unavailable.length === 1 ? " is" : "s are"} waiting on a dependency.` : "Add a task when something new comes up."}</p><Link href="/inbox" className="button button-primary">Open inbox <ArrowRight size={14} /></Link></div>}
        </section>

        <div className="suggestions-head"><h2>Other suggestions</h2><Link href="/inbox">View inbox <ArrowRight size={13} /></Link></div>
        <div className="suggestion-grid">
          {alternatives.map((item) => {
            const alternative = state.tasks.find((candidate) => candidate.id === item.taskId)!;
            return <article className="suggestion surface" key={item.taskId}><div className="suggestion-head"><button className="suggestion-title" onClick={() => showTask(alternative.id)}>{alternative.title}</button><button className="icon-button" aria-label={`Start ${alternative.title}`} onClick={() => start(item.durationMinutes, alternative)}><Play size={14} /></button></div><div className="task-meta"><LevelTag level={alternative.reasoningLevel} />{alternative.deadlineAt && <span className="tag">Due {formatRelative(alternative.deadlineAt, now, timeZone)}</span>}</div><p>{item.explanation}</p><div className="suggestion-bottom"><span>{item.durationMinutes} min</span><button onClick={() => showTask(alternative.id)}>Choose task <ChevronRight size={13} /></button></div></article>;
          })}
          {!alternatives.length && <div className="suggestion-empty surface"><span>One clear next step</span><p>More options will appear as you add work.</p></div>}
        </div>

        <div className="today-summary-grid">
          <section className="summary-panel surface"><div className="summary-panel-head"><h3>Today’s progress</h3><span>{total ? Math.round(completed / total * 100) : 0}%</span></div><div className="progress-track"><i style={{ width: `${total ? completed / total * 100 : 0}%` }} /></div><div className="progress-foot"><span><b>{completed}</b> completed</span><span><b>{state.tasks.filter((item) => item.status === "in_progress").length}</b> in progress</span><span><b>{state.tasks.filter((item) => item.status !== "completed").length}</b> remaining</span></div></section>
          <section className="summary-panel focus-balance surface"><div className="summary-panel-head"><h3>Focus time</h3><span className="muted">Recorded today</span></div><div className="focus-time"><Clock3 size={20} /><b>{Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m</b></div><p>{completedMinutes ? "Based on your completed focus sessions." : "Your session time will appear here as you work."}</p></section>
          <section className="summary-panel availability-panel surface"><div className="summary-panel-head"><h3>Available now</h3><MoreHorizontal size={16} /></div><div className="availability-value">{openMinutes}<small>min</small></div><p>Time available for your next focus block</p></section>
        </div>
      </section>

      {state.preferences.contextPanelOpen && <aside className="today-context">
        <section className="context-section schedule-panel surface">
          <div className="context-head"><div><h2>Today’s schedule</h2><span>{state.blocks.filter((block) => block.kind !== "flexible").length} commitments</span></div><Link href="/timeline">Full timeline <ArrowRight size={12} /></Link></div>
          <div className="time-checkin"><div className="control-label">How much time do you have?</div><div className="segmented-control">{[{ label: "15m", value: 15 }, { label: "30m", value: 30 }, { label: "1h", value: 60 }, { label: "2h+", value: 120 }].map((option) => <button key={option.value} className={state.preferences.availableMinutes === option.value ? "selected" : ""} onClick={() => setPreferences({ availableMinutes: option.value })}>{option.label}</button>)}</div><div className="control-label energy-label">Energy</div><div className="energy-control">{(["low", "medium", "high"] as const).map((energy) => <button className={state.preferences.energy === energy ? "selected" : ""} onClick={() => setPreferences({ energy })} key={energy}>{energy}</button>)}</div></div>
          <div className="timeline-head"><h3>Adaptive timeline</h3><button className="icon-button" aria-label={timelineOpen ? "Collapse timeline" : "Expand timeline"} onClick={() => setTimelineOpen((open) => !open)}>{timelineOpen ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
          {timelineOpen && <div className="mini-timeline">{[...state.blocks].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()).slice(0, 7).map((block) => <div className={`mini-event event-${block.kind}`} key={block.id}><div className="mini-event-time mono">{shortTime(block.startAt, timeZone)}</div><div className="mini-event-rule" /><button className="mini-event-body" onClick={() => block.taskId && showTask(block.taskId)}><b>{block.title}</b><span>{shortTime(block.startAt, timeZone)} – {shortTime(block.endAt, timeZone)}{block.locked ? " · Fixed" : ""}</span></button></div>)}</div>}
          <div className="context-footer"><button className="button" onClick={() => router.push("/timeline")}><CalendarDays size={14} /> Adjust timeline</button></div>
        </section>

        <section className="context-section deadline-panel surface"><div className="context-head"><div><h2>Needs attention</h2><span>Deadlines and dependencies</span></div><TriangleAlert size={16} className="muted" /></div>
          {result.risks.length ? <div className="risk-list">{result.risks.map((risk) => <div className="risk-item" key={risk.id}><span className="risk-dot" /><div><b>{risk.title}</b><small>Due {formatRelative(risk.deadlineAt!, now, timeZone)} · {risk.remainingMinutes} min remaining</small></div></div>)}</div> : <p className="no-risks"><Check size={15} /> No tasks currently at risk.</p>}
          {result.unavailable.length > 0 && <p className="dependency-note">{result.unavailable.length} task{result.unavailable.length === 1 ? " is" : "s are"} waiting on prerequisites. Review them in the inbox.</p>}
        </section>

        {state.revisions[0] && <section className="revision-card surface"><div className="revision-icon"><RefreshCw size={15} /></div><div><h3>Plan updated</h3><p>{state.revisions[0].explanation}</p></div><button className="icon-button" aria-label="Undo latest schedule revision" onClick={undoLatestRevision}><Undo2 size={15} /></button><button className="revision-accept" onClick={() => acceptRevision(state.revisions[0].id)}>Accept</button></section>}
        <section className="deadline-panel upcoming-panel surface"><div className="context-head"><div><h2>Upcoming</h2><span>Next deadlines</span></div><Link href="/inbox">See all <ArrowRight size={12} /></Link></div>{state.tasks.filter((item) => item.status !== "completed" && item.deadlineAt).sort((a, b) => new Date(a.deadlineAt!).getTime() - new Date(b.deadlineAt!).getTime()).slice(0, 3).map((item) => <button className="upcoming-row" key={item.id} onClick={() => showTask(item.id)}><span className={`upcoming-dot l${item.reasoningLevel}`} /><span><b>{item.title}</b><small>{formatRelative(item.deadlineAt!, now, timeZone)}</small></span><ChevronRight size={14} /></button>)}</section>
      </aside>}
    </div>
  </div>;
}

