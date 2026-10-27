/** Refined version of the app's existing crossing-path mark. */
export function BrandSymbol() {
  return <svg className="brand-symbol" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="16" fill="#17191c" />
    <path d="M19 19 45 45M19 45 28 36" fill="none" stroke="#fafaf8" strokeWidth="6" strokeLinecap="round" />
    <path className="brand-symbol-accent" d="M36 28 45 19M35 19h10v10" fill="none" stroke="#7594ff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}
