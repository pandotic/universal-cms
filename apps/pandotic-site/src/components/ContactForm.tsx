"use client";

import { useState, type FormEvent } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(false);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(formData as unknown as Record<string, string>).toString(),
      });

      if (!response.ok) throw new Error("Form submission failed");
      setSubmitted(true);
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12" role="alert" aria-live="polite">
        <p className="text-white text-xl font-semibold mb-2">Thank you!</p>
        <p className="text-gray-400">We&apos;ll be in touch soon.</p>
      </div>
    );
  }

  return (
    <form
      name="contact"
      method="POST"
      data-netlify="true"
      data-netlify-honeypot="bot-field"
      onSubmit={handleSubmit}
      aria-busy={submitting}
      className="space-y-5 md:space-y-6"
    >
      <input type="hidden" name="form-name" value="contact" />
      <p className="hidden">
        <label>
          Don&apos;t fill this out: <input name="bot-field" />
        </label>
      </p>

      {error && (
        <div role="alert" className="bg-red-900/30 border border-red-500/40 text-red-300 text-sm rounded-lg px-4 py-3">
          Something went wrong. Please try again or email us directly.
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm text-gray-400 mb-2">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          placeholder="Jane Smith"
          required
          aria-required="true"
          className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-accent)] focus:outline-none transition-colors text-base"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm text-gray-400 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="jane@pandotic.ai"
          required
          aria-required="true"
          className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-accent)] focus:outline-none transition-colors text-base"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm text-gray-400 mb-2">
          Project Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          placeholder="Tell us about your project..."
          required
          aria-required="true"
          className="w-full bg-transparent border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:border-[var(--color-accent)] focus:outline-none transition-colors resize-none text-base"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 active:bg-gray-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Sending...
          </span>
        ) : (
          "Submit"
        )}
      </button>
    </form>
  );
}
