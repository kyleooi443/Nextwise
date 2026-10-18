"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, BarChart3, CircleHelp } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import { deriveInsights } from "@/lib/insights";

export default function InsightsPage() {
  const { state, hydrated } = useNextwise();
  const insights = useMemo(() => deriveInsights(state), [state]);
  if (!hydrated) return <div className="loading-line">Loading your insights…</div>;
  return <div className="insights-screen">
    <div className="page-heading"><div><div className="date-line">Patterns from your own activity</div><h1>Insights</h1><p>Only observations supported by recorded sessions appear here.</p></div></div>
    {insights.length ? <div className="insight-grid">{insights.map((insight) => <article className="insight-card surface" key={insight.title}><span className="insight-icon"><BarChart3 size={17} /></span><span className="eyebrow">{insight.sample}</span><h2>{insight.title}</h2><p>{insight.detail}</p></article>)}</div> : <section className="insights-empty surface"><div className="insight-empty-icon"><CircleHelp size={19} /></div><h2>Your patterns will show up here over time.</h2><p>We need at least five completed focus sessions before drawing a pattern. For now, NEXTWISE uses only the time, energy, and task details you set.</p><div className="insight-data"><span><b>{state.sessions.filter((session) => session.endedAt).length}</b><small>recorded sessions</small></span><span><b>5</b><small>sessions to begin</small></span></div><Link href="/focus" className="button button-primary">Start a focus session <ArrowRight size={14} /></Link></section>}
    <section className="insight-method"><h2>How insights work</h2><p>Insights use completed sessions and task details stored in this browser. NEXTWISE does not infer your mood, diagnose conditions, or send task data to an AI service.</p></section>
  </div>;
}
