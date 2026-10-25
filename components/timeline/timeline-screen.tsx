"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Clock3, LockKeyhole, LockOpen, RotateCcw, Undo2 } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { LevelTag } from "@/components/level-tag";
import { addDaysToDayKey, dayKeyInTimeZone, formatInTimeZone, localDateTimeToInstant } from "@/lib/date-time";
import { formatRelative } from "@/lib/scheduler";
import type { CalendarBlock } from "@/types/nextwise";

type ViewMode = "day" | "week";

function time(value: string, timeZone: string) {
  return formatInTimeZone(value, timeZone, { hour: "numeric", minute: "2-digit" });
}

function duration(block: CalendarBlock) {
  return Math.round((new Date(block.endAt).getTime() - new Date(block.startAt).getTime()) / 60_000);
}

function blockLabel(block: CalendarBlock) {
  if (block.kind === "fixed") return "Fixed commitment";
  if (block.kind === "break") return "Break";
  return "Focus block";
}

export function TimelineScreen() {
  const { state, hydrated, toggleBlockLock, acceptRevision, undoLatestRevision, setPreferences } = useNextwise();
  const [view, setView] = useState<ViewMode>("day");
  const [showFixed, setShowFixed] = useState(true);
  const today = new Date();
  const timeZone = state.preferences.timezone;
  const todayKey = dayKeyInTimeZone(today, timeZone);
  const dayName = formatInTimeZone(today, timeZone, { weekday: "long", month: "long", day: "numeric" });

  const blocks = useMemo(() => [...state.blocks]
    .filter((block) => showFixed || block.kind === "flexible")
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()), [state.blocks, showFixed]);
  const todayBlocks = blocks.filter((block) => dayKeyInTimeZone(block.startAt, timeZone) === todayKey);
  const markerIndex = todayBlocks.findIndex((block) => new Date(block.startAt).getTime() > today.getTime());
  const focusMinutes = todayBlocks.filter((block) => block.kind === "flexible").reduce((total, block) => total + duration(block), 0);
  const weekDays = Array.from({ length: 7 }, (_, index) => {
    const key = addDaysToDayKey(todayKey, index);
    const date = localDateTimeToInstant(key, "12:00", timeZone);
    return {
      date,
      key,
      blocks: blocks.filter((block) => dayKeyInTimeZone(block.startAt, timeZone) === key),
      tasks: state.tasks.filter((task) => task.status !== "completed" && task.deadlineAt && dayKeyInTimeZone(task.deadlineAt, timeZone) === key),
    };
  });
  const upcomingDeadlines = state.tasks
    .filter((task) => task.status !== "completed" && task.deadlineAt)
    .sort((a, b) => new Date(a.deadlineAt!).getTime() - new Date(b.deadlineAt!).getTime())
    .slice(0, 4);

  if (!hydrated) return <div className="loading-line">Loading your timeline…</div>;

  return <div className="timeline-screen">
    <div className="page-heading timeline-heading">
      <div>
        <div className="date-line">Your day, with room to adjust</div>
        <h1>Timeline</h1>
        <p>Fixed plans stay put. Focus time can move when your day changes.</p>
      </div>
      <div className="heading-actions">
        <div className="view-toggle timeline-view-toggle" role="tablist" aria-label="Timeline view">
          <button type="button" role="tab" aria-selected={view === "day"} className={view === "day" ? "selected" : ""} onClick={() => setView("day")}>Day</button>
          <button type="button" role="tab" aria-selected={view === "week"} className={view === "week" ? "selected" : ""} onClick={() => setView("week")}>Week</button>
        </div>
      </div>
    </div>

    {state.revisions[0] && <section className="timeline-revision surface" aria-live="polite">
      <div className="revision-icon"><RotateCcw size={15} aria-hidden="true" /></div>
      <div className="timeline-revision-copy">
        <b>{state.revisions[0].undoneAt ? "Previous plan restored" : "Your plan has been updated"}</b>
        <p>{state.revisions[0].undoneAt ? "The revision is retained in your history." : state.revisions[0].explanation}</p>
      </div>
      {!state.revisions[0].accepted && !state.revisions[0].undoneAt && <div className="timeline-revision-actions">
        <button type="button" className="button" onClick={undoLatestRevision}><Undo2 size={14} aria-hidden="true" /> Undo</button>
        <button type="button" className="button button-blue" onClick={() => acceptRevision(state.revisions[0].id)}><Check size={14} aria-hidden="true" /> Accept plan</button>
      </div>}
    </section>}

    {view === "day" ? <div className="timeline-layout">
      <section className="timeline-day surface" aria-labelledby="timeline-day-title">
        <div className="timeline-day-head">
          <div><span className="eyebrow">Today</span><h2 id="timeline-day-title">{dayName}</h2></div>
          <button type="button" className="button timeline-filter-button" aria-pressed={showFixed} onClick={() => setShowFixed((value) => !value)}>
            <CalendarDays size={14} aria-hidden="true" /> Fixed events <span className="timeline-filter-state">{showFixed ? "Shown" : "Hidden"}</span>
          </button>
        </div>
        <div className="timeline-summary" aria-label="Today's schedule summary">
          <span><b>{todayBlocks.length}</b> {todayBlocks.length === 1 ? "event" : "events"}</span>
          <span><b>{focusMinutes} min</b> planned focus</span>
          <span><i className="timeline-live-dot" /> Current local time</span>
        </div>
        <div className="timeline-events">
          {todayBlocks.length ? <>
            {todayBlocks.map((block, index) => {
              const task = state.tasks.find((item) => item.id === block.taskId);
              return <div className="timeline-event-wrap" key={block.id}>
                {index === markerIndex && <div className="current-time-marker"><span className="mono">Now · {time(today.toISOString(), timeZone)}</span><i /></div>}
                <article className={`timeline-event event-${block.kind}`}>
                  <div className="timeline-time mono"><b>{time(block.startAt, timeZone)}</b><small>{duration(block)} min</small></div>
                  <div className="timeline-spine" aria-hidden="true"><i /></div>
                  <div className="timeline-event-card">
                    <div className="timeline-event-info">
                      <span className="event-kind">{blockLabel(block)}</span>
                      <h3>{block.title}</h3>
                      {task && <>
                        <div className="timeline-task-meta"><LevelTag level={task.reasoningLevel} />{task.deadlineAt && <span className="tag">Due {formatRelative(task.deadlineAt, today, timeZone)}</span>}</div>
                        <p>{task.microStep}</p>
                      </>}
                    </div>
                    <div className="timeline-event-actions">
                      {block.kind === "flexible" && <button type="button" className="icon-button timeline-lock-button" aria-label={block.locked ? `Unlock ${block.title}` : `Lock ${block.title}`} aria-pressed={block.locked} title={block.locked ? "Unlock focus block" : "Lock focus block"} onClick={() => toggleBlockLock(block.id)}>{block.locked ? <LockKeyhole size={15} aria-hidden="true" /> : <LockOpen size={15} aria-hidden="true" />}</button>}
                      <span className="event-end mono">Ends {time(block.endAt, timeZone)}</span>
                    </div>
                  </div>
                </article>
              </div>;
            })}
            {markerIndex < 0 && <div className="current-time-marker"><span className="mono">Now · {time(today.toISOString(), timeZone)}</span><i /></div>}
          </> : <div className="timeline-empty">
            <span className="timeline-empty-icon"><CalendarDays size={18} aria-hidden="true" /></span>
            <h3>Your day is open</h3>
            <p>No events are scheduled for today. Add a task and NEXTWISE can make room for it.</p>
            <Link className="button button-primary" href="/inbox">Add a task <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>}
        </div>
        <div className="timeline-note"><LockKeyhole size={14} aria-hidden="true" /><span>Fixed commitments and locked focus blocks stay in place when NEXTWISE replans.</span></div>
      </section>

      <aside className="timeline-side" aria-label="Schedule details">
        <section className="surface timeline-side-panel">
          <div className="timeline-panel-heading"><span className="timeline-panel-icon"><Clock3 size={15} aria-hidden="true" /></span><div><h2>Available focus time</h2><p>How much room do you have for work today?</p></div></div>
          <div className="timeline-availability" role="group" aria-label="Available focus time">
            {[15, 30, 60, 120].map((minutes) => <button type="button" key={minutes} aria-pressed={state.preferences.availableMinutes === minutes} className={state.preferences.availableMinutes === minutes ? "selected" : ""} onClick={() => setPreferences({ availableMinutes: minutes })}>{minutes === 120 ? "2h+" : `${minutes}m`}</button>)}
          </div>
          <Link className="timeline-settings-link" href="/settings">Change availability in settings <ArrowRight size={12} aria-hidden="true" /></Link>
        </section>

        <section className="surface timeline-side-panel">
          <div className="timeline-panel-heading"><span className="timeline-panel-icon timeline-deadline-icon"><CalendarDays size={15} aria-hidden="true" /></span><div><h2>Upcoming deadlines</h2><p>{upcomingDeadlines.length ? "The next tasks on your list" : "You have no upcoming deadlines"}</p></div></div>
          {upcomingDeadlines.length ? <div className="timeline-deadlines">{upcomingDeadlines.map((task) => <Link className="timeline-deadline" href="/inbox" key={task.id}>
            <span className="timeline-deadline-copy"><b>{task.title}</b><small>{task.remainingMinutes} min remaining</small></span><span className="tag">{formatRelative(task.deadlineAt!, today, timeZone)}</span>
          </Link>)}</div> : <Link className="timeline-settings-link" href="/inbox">Review your tasks <ArrowRight size={12} aria-hidden="true" /></Link>}
        </section>

        <section className="surface timeline-side-panel timeline-focus-panel">
          <div className="timeline-panel-heading"><span className="timeline-panel-icon"><Clock3 size={15} aria-hidden="true" /></span><div><h2>Ready to focus?</h2><p>Record a missed or partial session to rebuild your plan around what remains.</p></div></div>
          <Link className="button button-primary timeline-focus-link" href="/focus"><Clock3 size={14} aria-hidden="true" /> Start a focus session</Link>
        </section>
      </aside>
    </div> : <section className="week-agenda surface" aria-labelledby="week-agenda-title">
      <div className="week-agenda-head">
        <div><span className="eyebrow">Next seven days</span><h2 id="week-agenda-title">Deadlines and commitments</h2></div>
        <p>See your schedule and due dates at a glance.</p>
      </div>
      <div className="week-days">
        {weekDays.map(({ date, key, tasks, blocks: dayBlocks }, index) => <section className={`week-day ${index === 0 ? "is-today" : ""}`} key={key} aria-label={formatInTimeZone(date, timeZone, { weekday: "long", month: "long", day: "numeric" })}>
          <header><span>{formatInTimeZone(date, timeZone, { weekday: "short" })}</span><b>{Number(key.slice(-2))}</b>{index === 0 && <small>Today</small>}</header>
          <div className="week-day-events">
            {dayBlocks.map((block) => <div className={`week-event ${block.kind === "flexible" ? "task" : block.kind}`} key={block.id}>
              <span>{time(block.startAt, timeZone)} <i aria-hidden="true">·</i> {duration(block)} min{block.locked ? " · Locked" : ""}</span><b>{block.title}</b>
            </div>)}
            {tasks.map((task) => <Link className="week-event deadline" href="/inbox" key={task.id}>
              <span>Due {time(task.deadlineAt!, timeZone)}</span><b>{task.title}</b><LevelTag level={task.reasoningLevel} />
            </Link>)}
            {!tasks.length && !dayBlocks.length && <span className="week-empty">Nothing planned</span>}
          </div>
        </section>)}
      </div>
    </section>}
  </div>;
}
