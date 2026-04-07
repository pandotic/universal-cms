import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold text-foreground">
        Welcome to Universal CMS
      </h1>
      <p className="max-w-md text-center text-foreground-secondary">
        Your site is ready. Head to the admin panel to start managing content.
      </p>
      <Link
        href="/admin"
        className="rounded-lg bg-brand-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-primary-dark"
      >
        Go to Admin
      </Link>
    </main>
  );
}
