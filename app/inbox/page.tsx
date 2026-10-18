"use client";

import { Suspense } from "react";
import { InboxScreen } from "@/components/tasks/inbox-screen";

export default function InboxPage() {
  return <Suspense fallback={<div className="loading-line">Loading your tasks…</div>}><InboxScreen /></Suspense>;
}
