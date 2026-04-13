import Link from "next/link";

export default function NotFound() {
  return (
    <section className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[var(--color-accent)] text-sm font-semibold tracking-widest uppercase mb-4">
          404
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
          Page not found
        </h1>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block bg-[var(--color-accent)] text-white font-semibold px-8 py-3 rounded-full hover:brightness-110 active:scale-[0.98] transition-all"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
