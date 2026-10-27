import { AuthForm } from '@/components/auth/auth-form';
import { authConfigured } from '@/lib/auth/server';
export default function Signup() { return <AuthForm mode="signup" configured={authConfigured()} />; }
