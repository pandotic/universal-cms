import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Sign in",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-700 border-t-white" />
    </div>
  );
}
