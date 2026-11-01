import Link from 'next/link';
import { BrandSymbol } from '@/components/brand-symbol';
import '../auth.css';
export const dynamic = 'force-dynamic';
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-layout"><section className="auth-story" aria-label="About nextwise"><Link className="auth-brand" href="/login" aria-label="nextwise home"><BrandSymbol /><span>nextwise</span></Link><div className="auth-story-copy"><span className="auth-eyebrow">A little clarity. A little progress.</span><h1>Stop planning.<br /><span>Start doing.</span></h1><p>You don’t need to figure out everything.<br />Just your next meaningful step.</p><div className="auth-preview"><span className="auth-preview-label">ONE THING AT A TIME</span><div><span className="auth-preview-check" aria-hidden="true">✓</span><span>Make room for what matters.<small>A clearer next step for a better you.</small></span></div></div></div><p className="auth-story-foot">Less overwhelm. More forward.</p></section><section className="auth-form-panel"><Link className="auth-brand auth-mobile-brand" href="/login"><BrandSymbol /><span>nextwise</span></Link>{children}<p className="auth-footer">A calmer way to move forward.</p></section></main>;
}
