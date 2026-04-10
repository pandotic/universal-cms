'use client';

import { useEffect, useRef } from 'react';

const SKILL_STORE_URL = 'https://pando-skillo.netlify.app';

export default function SkillStorePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<{ unmount: () => void } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadWidget = async () => {
      try {
        // Dynamically import the Pando Skill Store widget
        // @ts-ignore - external ESM module, no type definitions available
        const { mount } = await import(
          /* webpackIgnore: true */ `${SKILL_STORE_URL}/widget/skill-store.mjs`
        );

        if (cancelled || !containerRef.current) return;

        // Mount the widget in the container
        // Optional: pass an existing GitHub token to skip the widget's own auth
        // For now, we let the widget handle its own GitHub OAuth
        widgetRef.current = mount(containerRef.current, {
          // ghToken: existingToken,  // Future: extract from Supabase session if available
        });
      } catch (err) {
        console.error('Failed to load Skill Store widget:', err);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML =
            '<div style="padding: 2rem; color: #ef4444;">Failed to load Skill Store. Please try again later.</div>';
        }
      }
    };

    loadWidget();

    return () => {
      cancelled = true;
      widgetRef.current?.unmount();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ minHeight: '100vh' }}
      className="bg-zinc-950"
    />
  );
}
