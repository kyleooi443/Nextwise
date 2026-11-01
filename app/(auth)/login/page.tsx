import { AuthForm } from '@/components/auth/auth-form';
import { authConfigured } from '@/lib/auth/server';
import { safeNext } from '@/lib/auth/validation';
export default async function Login({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
 const params = await searchParams;
 return <AuthForm mode="login" configured={authConfigured()} next={safeNext(params.next)} initialError={params.error === 'link' ? 'This link is invalid or has expired. Request a new link and try again.' : ''} />;
}
