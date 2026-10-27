import { AuthForm } from '@/components/auth/auth-form';
import { authConfigured } from '@/lib/auth/server';
export default function ResendVerification() { return <AuthForm mode="resend" configured={authConfigured()} />; }
