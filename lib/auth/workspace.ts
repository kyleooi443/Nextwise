/** Account-scoped browser persistence; legacy demo state is never auto-assigned. */
export function workspaceStorageKey(userId: string) {
  if (!userId || !/^[a-zA-Z0-9-]+$/.test(userId)) throw new Error('Invalid workspace identity');
  return `nextwise-state-v1:${userId}`;
}
