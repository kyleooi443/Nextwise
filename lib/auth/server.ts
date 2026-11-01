import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
export function authConfigured() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
export async function serverAuth() {
  if (!authConfigured()) throw new Error('Authentication is not configured');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookieOptions: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' },
    cookies: { getAll: () => jar.getAll(), setAll(values) { try { values.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* Server components rely on proxy for refreshed cookies. */ } } },
  });
}
export async function requireUser() {
  if (!authConfigured()) redirect('/login');
  const client = await serverAuth();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || !data.user.email_confirmed_at) redirect('/login');
  return data.user;
}
