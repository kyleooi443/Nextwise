import { AuthForm } from '@/components/auth/auth-form';
import { authConfigured } from '@/lib/auth/server';
export default function ForgotPassword() { return <AuthForm mode="forgot" configured={authConfigured()} />; }
