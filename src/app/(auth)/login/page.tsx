import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/login-form'
import AuthDebug from '@/components/auth/auth-debug';

export const metadata: Metadata = {
  title: 'Login | Game Studio',
  description: 'Sign in to your Game Studio account',
}

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <LoginForm />
      <AuthDebug />
    </div>
  );
}
