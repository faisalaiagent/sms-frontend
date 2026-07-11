import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            SMS Admin Portal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sign in to manage your school
          </p>
        </div>
        <SignIn
          fallbackRedirectUrl="/dashboard"
          appearance={{
            elements: {
              card: 'shadow-md',
            },
          }}
        />
      </div>
    </div>
  );
}
