"use client";

import Link from "next/link";
import { BrandSymbol } from "@/components/brand-symbol";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Clock3, LockKeyhole, Pause, Play, Shield, SkipForward, X } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { LevelTag } from "@/components/level-tag";
import { recommendNext } from "@/lib/scheduler";
import type { FocusOutcome, Task } from "@/types/nextwise";

function clock(seconds: number) {
  const safe = Math.max(0, seconds);
  return `${`${Math.floor(safe / 60)}`.padStart(2, "0")}:${`${safe % 60}`.padStart(2, "0")}`;
}

export function FocusScreen() {
  const router = useRouter();
  const { state, hydrated, startFocus, adjustFocus, toggleFocusPause, finishFocus, setSelectedTask } = useNextwise();
  const activeSession = state.sessions.find((session) => session.id === state.activeSessionId);
  const activeTask = state.tasks.find((task) => task.id === (activeSession?.taskId ?? state.selectedTaskId));
  const recs = useMemo(() => recommendNext(state).ranked, [state]);
  const suggested = state.tasks.find((task) => task.id === recs.find((item) => item.taskId !== activeTask?.id)?.taskId);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [actual, setActual] = useState("");
  const [remaining, setRemaining] = useState("");
  const [customMinutes, setCustomMinutes] = useState(25);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!activeSession) { setSecondsLeft(0); return; }
      const pausedElapsed = (activeSession.pausedSeconds ?? 0) + (activeSession.pausedAt ? Math.floor((Date.now() - new Date(activeSession.pausedAt).getTime()) / 1000) : 0);
      const elapsed = Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000) - pausedElapsed;
      setSecondsLeft(Math.max(0, activeSession.plannedMinutes * 60 - elapsed));
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.pausedAt || outcomeOpen) return;
    const interval = window.setInterval(() => setSecondsLeft((current) => {
      if (current <= 1) { window.clearInterval(interval); setOutcomeOpen(true); return 0; }
      return current - 1;
    }), 1000);
    return () => window.clearInterval(interval);
  }, [activeSession, outcomeOpen]);

  function begin(task: Task, minutes: number) {
    setSelectedTask(task.id);
    setCustomMinutes(minutes);
    startFocus(task.id, minutes);
    setOutcomeOpen(false);
  }

  function finish(outcome: FocusOutcome) {
    const session = activeSession;
    const actualMinutes = actual ? Number(actual) : outcome === "skipped" ? 0 : session ? Math.max(0, session.plannedMinutes - Math.ceil(secondsLeft / 60)) : undefined;
    finishFocus(outcome, actualMinutes, remaining ? Number(remaining) : undefined);
    setOutcomeOpen(false);
    setActual("");
    setRemaining("");
    router.push(outcome === "completed" ? "/today" : "/timeline");
  }

  if (!hydrated) return <div className="loading-line">Preparing focus…</div>;

  if (!activeTask || !activeSession) return <section className="focus-setup surface">
    <div className="focus-setup-top"><Link href="/today"><ArrowLeft size={15} /> Back to today</Link><span><LockKeyhole size={13} /> Your work stays on this device</span></div>
    <div className="focus-setup-content"><span className="eyebrow">Focus mode</span><h1>Make a little room for one thing.</h1><p>Choose a task and a time window. You can pause or change course whenever you need.</p>
      {recs.length ? <><div className="focus-choice-list">{recs.slice(0, 3).map((item) => { const task = state.tasks.find((candidate) => candidate.id === item.taskId)!; return <button className="focus-choice surface" key={task.id} onClick={() => begin(task, item.durationMinutes)}><span className="focus-choice-icon"><Play size={14} /></span><span className="focus-choice-main"><b>{task.title}</b><span><LevelTag level={task.reasoningLevel} /> <small>Recommended · {item.durationMinutes} min</small></span></span></button>; })}</div><div className="focus-setup-actions"><button className="button" onClick={() => { const first = state.tasks.find((task) => task.id === recs[0].taskId); if (first) begin(first, 5); }}><Play size={13} /> Try a 5-minute starter</button><label>Custom duration<input type="number" min="1" max="180" value={customMinutes} onChange={(event) => setCustomMinutes(Number(event.target.value))} /><button className="button" onClick={() => { const first = state.tasks.find((task) => task.id === recs[0].taskId); if (first) begin(first, customMinutes); }}>Start</button></label></div></> : <div className="focus-empty"><p>No tasks are ready to focus on right now.</p><Link className="button" href="/inbox">Add or unblock a task</Link></div>}
      <Link className="focus-other-link" href="/inbox">Choose another task from your inbox <ArrowLeft size={13} /></Link>
    </div>
  </section>;

  const elapsedPercent = Math.min(100, Math.max(0, ((activeSession.plannedMinutes * 60 - secondsLeft) / (activeSession.plannedMinutes * 60)) * 100));
  return <div className="focus-screen">
    <div className="focus-toolbar"><button className="focus-exit" onClick={() => router.push("/today")}><X size={17} /> Exit focus</button><span className="focus-wordmark"><BrandSymbol />nextwise</span><button className="focus-toolbar-action" onClick={() => setShowPicker((value) => !value)}><Clock3 size={14} /> Adjust</button></div>
    {showPicker && <div className="focus-adjust"><span>Set session length</span><div>{[5, 15, 25, 50].map((minutes) => <button key={minutes} onClick={() => { adjustFocus(minutes); setShowPicker(false); }}>{minutes} min</button>)}<label><input aria-label="Custom focus minutes" type="number" min="1" max="180" value={customMinutes} onChange={(event) => setCustomMinutes(Number(event.target.value))} /><button onClick={() => { adjustFocus(customMinutes); setShowPicker(false); }}>Set</button></label></div></div>}
    <main className="focus-body">
      <div className="focus-task-area"><span className="focus-level"><LevelTag level={activeTask.reasoningLevel} /></span><h1>{activeTask.title}</h1><p>{activeTask.microStep}</p>
        <div className="focus-clock-wrap"><div className="focus-clock mono" aria-live="off">{clock(secondsLeft)}</div><span className="focus-clock-label">remaining</span><div className="focus-progress"><i style={{ width: `${elapsedPercent}%` }} /></div></div>
        <div className="focus-controls"><button className="pause-control" onClick={toggleFocusPause} aria-label={activeSession.pausedAt ? "Resume timer" : "Pause timer"}>{activeSession.pausedAt ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}</button><button className="focus-done" onClick={() => setOutcomeOpen(true)}><Check size={16} /> Finish session</button></div>
        <div className="focus-footnote"><Shield size={14} /> A timer is a guide. You’re in control of your time.</div>
      </div>
      <aside className="focus-next"><span className="eyebrow">Next up</span>{suggested ? <div className="focus-next-item"><span className="next-radio" /><span><b>{suggested.title}</b><small>{recs.find((item) => item.taskId === suggested.id)?.durationMinutes ?? 25} min · L{suggested.reasoningLevel}</small></span></div> : <p>There’s no other ready task after this one.</p>}</aside>
    </main>
    {outcomeOpen && <div className="modal-backdrop focus-outcome-backdrop"><section className="outcome-modal surface" role="dialog" aria-modal="true" aria-labelledby="outcome-title"><div className="modal-head"><div><span className="eyebrow">Session update</span><h2 id="outcome-title">How did it go?</h2></div><button className="icon-button" onClick={() => setOutcomeOpen(false)} aria-label="Close outcome"><X size={17} /></button></div><p className="outcome-task-name">{activeTask.title}</p><div className="outcome-options"><button onClick={() => finish("completed")}><Check size={16} /><b>Completed</b><small>That task is done</small></button><button onClick={() => finish("partial")}><Clock3 size={16} /><b>Partially done</b><small>Keep the remaining work</small></button><button onClick={() => finish("blocked")}><TriangleAlertIcon /><b>Blocked</b><small>Something is in the way</small></button><button onClick={() => finish("skipped")}><SkipForward size={16} /><b>Did not start</b><small>Replan around it</small></button></div><div className="outcome-inputs"><label>Actual focus time <span><input type="number" min="0" max="600" value={actual} onChange={(event) => setActual(event.target.value)} placeholder={`${Math.max(0, activeSession.plannedMinutes - Math.ceil(secondsLeft / 60))}`} /> min</span></label><label>Remaining effort <span><input type="number" min="0" max="600" value={remaining} onChange={(event) => setRemaining(event.target.value)} placeholder={`${activeTask.remainingMinutes}`} /> min</span></label></div></section></div>}
  </div>;
}

function TriangleAlertIcon() { return <span className="warning-glyph" aria-hidden="true">!</span>; }
