"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Bell, CalendarDays, ChartNoAxesColumnIncreasing, CheckSquare2, ChevronDown, CircleHelp, Command, Focus, Inbox, LayoutDashboard, ListTodo, Menu, Search, Settings, UserRound, X } from "lucide-react";
import { useNextwise } from "@/components/app-provider";
import type { ViewKey } from "@/types/nextwise";

const items: { label: string; href: string; key: ViewKey; icon: typeof LayoutDashboard }[] = [
  { label: "Today", href: "/today", key: "today", icon: LayoutDashboard },
  { label: "Inbox", href: "/inbox", key: "inbox", icon: Inbox },
  { label: "Timeline", href: "/timeline", key: "timeline", icon: CalendarDays },
  { label: "Focus", href: "/focus", key: "focus", icon: Focus },
  { label: "Review", href: "/review", key: "review", icon: CheckSquare2 },
  { label: "Insights", href: "/insights", key: "insights", icon: ChartNoAxesColumnIncreasing },
  { label: "Settings", href: "/settings", key: "settings", icon: Settings },
];
const mobileItems = items.filter((item) => ["today", "inbox", "timeline", "review"].includes(item.key));

function Brand() {
  return <Link href="/today" className="brand" aria-label="NEXTWISE home"><span className="brand-mark"><i /><i /></span><span>NEXTWISE</span></Link>;
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { state, resetDemo } = useNextwise();
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [dismissedRevisionId, setDismissedRevisionId] = useState<string | undefined>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const active = items.find((item) => item.href === pathname)?.key ?? "today";

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(`/inbox${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <Brand />
        <nav className="side-nav" aria-label="Primary navigation">
          <span className="nav-caption">Workspace</span>
          {items.map(({ label, href, key, icon: Icon }) => <Link key={key} href={href} className={`nav-link ${active === key ? "active" : ""}`} aria-current={active === key ? "page" : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{key === "inbox" && <small>{state.tasks.filter((task) => task.status === "todo").length}</small>}</Link>)}
        </nav>
        <div className="sidebar-foot">
          <div className="side-quote"><span className="side-quote-mark" aria-hidden="true"><span className="brand-mark"><i /><i /></span></span><p>Stop planning.<br />Start doing.</p><span className="side-quote-rule" /></div>
          <button className="profile-row" onClick={() => setProfileOpen((value) => !value)} aria-expanded={profileOpen}><span className="avatar">{state.preferences.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span className="profile-name"><b>{state.preferences.name}</b><small>Personal workspace</small></span><ChevronDown size={15} /></button>
          {profileOpen && <div className="profile-menu"><Link href="/settings" onClick={() => setProfileOpen(false)}><UserRound size={15} /> Profile & preferences</Link><button onClick={() => { resetDemo(); setProfileOpen(false); }}><ListTodo size={15} /> Reset demo data</button></div>}
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={19} /></button>
          <form className="global-search" onSubmit={search} role="search"><Search size={16} /><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks, projects, or ask anything..." aria-label="Search tasks" /><span className="search-shortcut"><Command size={12} /> K</span></form>
          <div className="topbar-actions">
            <div className="notice-wrap"><button className="icon-button" aria-label="Notifications" aria-expanded={noticeOpen} onClick={() => setNoticeOpen((value) => !value)}><Bell size={17} />{state.revisions.some((revision) => !revision.accepted) && <i className="notification-dot" />}</button>{noticeOpen && <div className="notice-popover"><b>Today at a glance</b><p>{state.tasks.filter((task) => task.status === "todo").length} tasks ready to work on</p>{state.revisions[0] && <p className="notice-update">{state.revisions[0].explanation}</p>}<Link href="/timeline" onClick={() => setNoticeOpen(false)}>View timeline</Link></div>}</div>
            <button className="top-profile" onClick={() => router.push("/settings")} aria-label="Open profile and settings"><span className="avatar">{state.preferences.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span>{state.preferences.name}</span><ChevronDown size={14} /></button>
          </div>
        </header>
        {state.revisions[0] && !state.revisions[0].accepted && state.revisions[0].id !== dismissedRevisionId && <div className="plan-banner"><span className="banner-marker" /><span>{state.revisions[0].explanation}</span><Link href="/timeline">Review plan</Link><button className="icon-button" aria-label="Dismiss plan update" onClick={() => setDismissedRevisionId(state.revisions[0].id)}><X size={14} /></button></div>}
        <main id="main-content" className="main-content">{children}</main>
        {active !== "today" && active !== "focus" && <Link className="mobile-focus-shortcut" href="/focus"><Focus size={16} /><span>Focus</span></Link>}
        <nav className="mobile-nav" aria-label="Mobile navigation">{mobileItems.map(({ label, href, key, icon: Icon }) => <Link key={key} href={href} className={active === key ? "active" : ""} aria-current={active === key ? "page" : undefined}><Icon size={19} strokeWidth={1.9} /><span>{label}</span></Link>)}</nav>
      </div>

      {mobileOpen && <div className="mobile-drawer-backdrop" onClick={() => setMobileOpen(false)}><div className="mobile-drawer" onClick={(event) => event.stopPropagation()}><div className="mobile-drawer-head"><Brand /><button className="icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button></div>{items.map(({ label, href, key, icon: Icon }) => <Link key={key} href={href} className={`nav-link ${active === key ? "active" : ""}`} onClick={() => setMobileOpen(false)}><Icon size={18} />{label}</Link>)}<button className="button button-primary drawer-focus" onClick={() => { router.push("/focus"); setMobileOpen(false); }}><Focus size={16} />Start focus</button></div></div>}
      <a className="help-link" href="mailto:hello@nextwise.app" aria-label="Contact support"><CircleHelp size={16} /></a>
    </div>
  );
}
