import { AuthForm } from '@/components/auth/auth-form';
import { requireUser } from '@/lib/auth/server';
export default async function ResetPassword() { await requireUser(); return <AuthForm mode="reset" configured />; }
