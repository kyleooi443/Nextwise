export type AuthAction = 'login' | 'signup' | 'forgot' | 'reset' | 'resend' | 'logout';
export type AuthErrors = Partial<Record<'email' | 'password' | 'confirmPassword' | 'name', string>>;
export function validateAuthInput(action: AuthAction, input: Record<string, unknown>) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  const errors: AuthErrors = {};
  if (['login', 'signup', 'forgot', 'resend'].includes(action) && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) errors.email = 'Enter a valid email address.';
  if (['login', 'signup', 'reset'].includes(action) && (!password || password.length > 128)) errors.password = 'Enter a password of up to 128 characters.';
  if (['signup', 'reset'].includes(action)) {
    if (password.length < 12) errors.password = 'Use at least 12 characters. A longer passphrase works well.';
    if (input.confirmPassword !== password) errors.confirmPassword = 'The passwords don’t match.';
  }
  if (action === 'signup' && (!name || name.length > 80)) errors.name = 'Enter your name using 1–80 characters.';
  return { email, name, password, errors };
}
export function safeNext(value: unknown): string {
  if (typeof value !== 'string' || /[\\\r\n]/.test(value)) return '/today';
  const path = value.split('?')[0];
  return ['/today', '/inbox', '/timeline', '/review', '/insights', '/settings', '/focus'].includes(path) ? value : '/today';
}
export function isSameOrigin(origin: string | null, expected: string): boolean {
  try { return !!origin && new URL(origin).origin === new URL(expected).origin; } catch { return false; }
}
