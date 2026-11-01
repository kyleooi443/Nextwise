'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { ArrowRight, Eye, EyeOff, LoaderCircle, Mail, ArrowLeft } from 'lucide-react';
import { validateAuthInput, safeNext, type AuthErrors } from '@/lib/auth/validation';
type Mode = 'login' | 'signup' | 'forgot' | 'reset' | 'resend';
const copy = {
 resend: { title: 'One more step.', subtitle: 'Get a new link to verify your email address.', button: 'Send verification link', eyebrow: 'VERIFY YOUR EMAIL' },
 login: { title: 'Welcome back.', subtitle: 'Your next step is waiting for you.', button: 'Log in', eyebrow: 'PICK UP WHERE YOU LEFT OFF' },
 signup: { title: 'Start with one step.', subtitle: 'Create your account. Make space for progress.', button: 'Create account', eyebrow: 'A FRESH START' },
 forgot: { title: 'Let’s get you back in.', subtitle: 'Enter your email and we’ll send a password reset link.', button: 'Send reset link', eyebrow: 'RESET YOUR PASSWORD' },
 reset: { title: 'A fresh start.', subtitle: 'Choose a new password to secure your account.', button: 'Save new password', eyebrow: 'SET A NEW PASSWORD' },
};
export function AuthForm({ mode, configured, initialError = '', next = '/today' }: { mode: Mode; configured: boolean; initialError?: string; next?: string }) {
 const [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState(initialError), [errors, setErrors] = useState<AuthErrors>({}), [sent, setSent] = useState(false), [email, setEmail] = useState('');
 const formRef = useRef<HTMLFormElement>(null); const errorRef = useRef<HTMLDivElement>(null); const inFlight = useRef(false);
 const c = copy[mode]; const hasPassword = mode !== 'forgot' && mode !== 'resend'; const newPassword = mode === 'signup' || mode === 'reset';
 async function submit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault(); if (inFlight.current || !configured) return;
  const values = Object.fromEntries(new FormData(event.currentTarget));
  const result = validateAuthInput(mode, values); setErrors(result.errors); setError('');
  if (Object.keys(result.errors).length) { formRef.current?.querySelector<HTMLInputElement>(`[name="${Object.keys(result.errors)[0]}"]`)?.focus(); return; }
  inFlight.current = true; setBusy(true);
  try {
   const response = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, next: safeNext(next) }) });
   const data = await response.json();
   if (!response.ok) { setErrors(data.errors ?? {}); throw new Error(data.message ?? 'Something went wrong. Please try again.'); }
   if (data.redirect) { window.location.assign(data.redirect); return; }
   setSent(true); setEmail(result.email);
  } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to connect. Please try again.'); requestAnimationFrame(() => errorRef.current?.focus()); }
  finally { inFlight.current = false; setBusy(false); }
 }
 if (sent) return <div className="auth-form-wrap auth-success"><span className="auth-mail-icon"><Mail size={25} /></span><h2>Check your inbox.</h2><p>{mode === 'forgot' ? 'If an account exists for' : mode === 'resend' ? 'If verification is needed for' : 'If this address can be registered,'} <strong>{email}</strong>{mode === 'forgot' ? ', you’ll receive a password reset link.' : ' you’ll receive an email with your next step.'}</p><p className="auth-hint">Check your spam folder too. For security, links expire and can only be used once.</p><Link className="button button-primary auth-submit" href="/login">Back to log in <ArrowRight size={17} /></Link><button className="auth-text-button" onClick={() => {setSent(false);setError('');}}>Use a different email</button></div>;
 return <div className="auth-form-wrap"><span className="auth-eyebrow">{c.eyebrow}</span><h2>{c.title}</h2><p className="auth-intro">{c.subtitle}</p>
 {!configured && <div className="auth-alert" role="status">Account access is being set up. Please check back shortly.</div>}
 {error && <div ref={errorRef} className="auth-alert auth-error" role="alert" tabIndex={-1}>{error}</div>}
 <form ref={formRef} onSubmit={submit} noValidate aria-busy={busy}>
 {mode === 'signup' && <label className="auth-field">Your name<input name="name" autoComplete="name" maxLength={80} placeholder="What should we call you?" required aria-invalid={!!errors.name} aria-describedby={errors.name ? 'name-error' : undefined} />{errors.name && <span id="name-error" className="auth-field-error">{errors.name}</span>}</label>}
 {mode !== 'reset' && <label className="auth-field">Email address<input name="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} maxLength={254} placeholder="you@example.com" required aria-invalid={!!errors.email} aria-describedby={errors.email ? 'email-error' : undefined} />{errors.email && <span id="email-error" className="auth-field-error">{errors.email}</span>}</label>}
 {hasPassword && <div className="auth-field"><div className="auth-label-row"><label htmlFor="password">{newPassword ? 'Create a password' : 'Password'}</label>{mode === 'login' && <Link href="/forgot-password">Forgot password?</Link>}</div><div className="auth-password"><input id="password" name="password" type={show ? 'text' : 'password'} autoComplete={newPassword ? 'new-password' : 'current-password'} minLength={newPassword ? 12 : undefined} maxLength={128} placeholder={newPassword ? 'At least 12 characters' : 'Enter your password'} required aria-invalid={!!errors.password} aria-describedby={errors.password ? 'password-error' : newPassword ? 'password-hint' : undefined} /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>{show ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>{errors.password && <span id="password-error" className="auth-field-error">{errors.password}</span>}{newPassword && <span id="password-hint" className="auth-hint">Use 12 or more characters. A memorable passphrase works well.</span>}</div>}
 {newPassword && <label className="auth-field">Confirm password<input name="confirmPassword" type={show ? 'text' : 'password'} autoComplete="new-password" maxLength={128} placeholder="Enter your password again" required aria-invalid={!!errors.confirmPassword} aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined} />{errors.confirmPassword && <span id="confirm-error" className="auth-field-error">{errors.confirmPassword}</span>}</label>}
 <button className="button button-primary auth-submit" type="submit" disabled={busy || !configured}>{busy ? <><LoaderCircle size={18} className="auth-spinner" /> Please wait…</> : <>{c.button}<ArrowRight size={18} /></>}</button>
 </form>
 {mode === 'login' ? <p className="auth-switch">New to nextwise? <Link href="/signup">Create an account</Link></p> : mode === 'signup' ? <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p> : <Link className="auth-back" href="/login"><ArrowLeft size={15} /> Back to log in</Link>}
 {mode === 'login' && <p className="auth-switch auth-verification"><Link href="/resend-verification">Need a new verification email?</Link></p>}
 {mode === 'signup' && <p className="auth-local-note">Your workspace stays on this device. Signing up doesn’t enable cloud sync.</p>}
 </div>;
}
