import { AppProvider } from '@/components/app-provider';
import { AppShell } from '@/components/app-shell';
import { requireUser } from '@/lib/auth/server';
export const dynamic = 'force-dynamic';
export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
 const user = await requireUser();
 const displayName = typeof user.user_metadata?.display_name === "string" ? user.user_metadata.display_name.slice(0, 80) : "My workspace";
 return <AppProvider key={user.id} userId={user.id} displayName={displayName}><AppShell>{children}</AppShell></AppProvider>;
}
