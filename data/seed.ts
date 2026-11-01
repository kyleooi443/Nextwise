import type { AppState, CalendarBlock, Task } from "@/types/nextwise";

function dayAtOffset(offset: number, hour: number, minute = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

export function createSeedState(): AppState {
  const now = new Date();
  const tasks: Task[] = [
    {
      id: "calculus", title: "Finish calculus assignment", description: "Complete the remaining integration problems and check the final answers.", project: "Calculus II", deadlineAt: dayAtOffset(1, 23, 59), importance: 0.92, estimatedMinutes: 60, remainingMinutes: 45, splittable: true, reasoningLevel: 3, status: "todo", dependencies: [], createdAt: now.toISOString(), ease: 0.52, microStep: "Open the assignment and solve the first two integration problems.", dismissals: 0,
    },
    {
      id: "programming-notes", title: "Review programming notes", description: "Revisit the latest lecture and collect questions for the lab.", project: "Software Engineering", deadlineAt: dayAtOffset(5, 17), importance: 0.72, estimatedMinutes: 30, remainingMinutes: 25, splittable: true, reasoningLevel: 2, status: "todo", dependencies: [], createdAt: now.toISOString(), ease: 0.72, microStep: "Open the latest lecture and review the first two topics.", dismissals: 0,
    },
    {
      id: "ui-mockups", title: "Prepare UI mockups", description: "Create the first pass of the project dashboard screens.", project: "Studio project", deadlineAt: dayAtOffset(3, 17), importance: 0.76, estimatedMinutes: 60, remainingMinutes: 45, splittable: true, reasoningLevel: 3, status: "todo", dependencies: [], createdAt: now.toISOString(), ease: 0.48, microStep: "Open the current brief and sketch the dashboard hierarchy.", dismissals: 0,
    },
    {
      id: "project-email", title: "Reply to project email", description: "Confirm the review time and answer the two open questions.", project: "Studio project", deadlineAt: dayAtOffset(0, 21), importance: 0.68, estimatedMinutes: 10, remainingMinutes: 10, splittable: false, reasoningLevel: 1, status: "todo", dependencies: [], createdAt: now.toISOString(), ease: 0.92, microStep: "Open the project thread and answer the two open questions.", dismissals: 0,
    },
    {
      id: "auth-system", title: "Develop authentication system", description: "Map the sign-in flow, then implement and review the core path.", project: "Nextwise", deadlineAt: dayAtOffset(7, 17), importance: 0.9, estimatedMinutes: 150, remainingMinutes: 120, splittable: true, reasoningLevel: 4, status: "todo", dependencies: [], createdAt: now.toISOString(), ease: 0.36, microStep: "Write down the sign-in states the first version needs to support.", dismissals: 0,
    },
    {
      id: "study-files", title: "Organize study files", description: "Move loose lecture downloads into the right course folders.", project: "Personal", importance: 0.3, estimatedMinutes: 20, remainingMinutes: 20, splittable: true, reasoningLevel: 1, status: "todo", dependencies: [], createdAt: now.toISOString(), ease: 0.9, microStep: "Sort the downloads folder by course and move the first group.", dismissals: 0,
    },
  ];

  const blocks: CalendarBlock[] = [
    { id: "routine", title: "Morning routine", startAt: dayAtOffset(0, 8), endAt: dayAtOffset(0, 9), kind: "fixed", locked: true },
    { id: "lunch", title: "Lunch", startAt: dayAtOffset(0, 12), endAt: dayAtOffset(0, 13), kind: "break", locked: true },
    { id: "meeting", title: "Project meeting", startAt: dayAtOffset(0, 14), endAt: dayAtOffset(0, 15), kind: "fixed", locked: true },
    { id: "gym", title: "Gym", startAt: dayAtOffset(0, 19, 30), endAt: dayAtOffset(0, 20, 30), kind: "fixed", locked: true },
    { id: "focus-programming", title: "Review programming notes", startAt: dayAtOffset(0, 10), endAt: dayAtOffset(0, 10, 30), kind: "flexible", locked: false, taskId: "programming-notes" },
    { id: "focus-mockups", title: "Prepare UI mockups", startAt: dayAtOffset(0, 16), endAt: dayAtOffset(0, 16, 45), kind: "flexible", locked: false, taskId: "ui-mockups" },
  ];

  return {
    version: 1,
    tasks,
    blocks,
    sessions: [],
    revisions: [],
    preferences: { name: "Jane Doe", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Manila", workStart: "08:00", workEnd: "20:00", availableMinutes: 30, energy: "medium", contextPanelOpen: true, theme: "light" },
    selectedTaskId: undefined,
  };
}

export function newId(prefix = "item"): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
