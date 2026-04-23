import { AuthForm } from '@/components/AuthForm';

export default function SignUpPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-gray-400">Join Isla.site to get started</p>
      </div>
      <AuthForm type="signup" />
    </div>
  );
}
