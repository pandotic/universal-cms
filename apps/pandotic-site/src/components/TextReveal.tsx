"use client";

import React, { useRef, useEffect, useState, type ReactNode } from "react";

interface TextRevealProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
}

/**
 * Reveals child text word-by-word with a stagger delay when scrolled into view.
 * Wrap text content — each word fades up individually with a pause between them.
 *
 * Usage:
 *   <TextReveal as="h2" className="text-4xl font-bold text-white">
 *     Powering rapid digital transformation
 *   </TextReveal>
 *
 * For mixed content (e.g. some words bold), pass JSX children:
 *   <TextReveal as="h1" className="...">
 *     Using AI to give your <span className="font-bold">humans Superpowers</span>
 *   </TextReveal>
 */
export default function TextReveal({
  children,
  className = "",
  stagger = 0.06,
  as: Tag = "div",
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Extract all text from children and split into words
  const text = extractText(children);
  const words = text.split(/\s+/).filter(Boolean);

  const Component = Tag as React.ElementType;

  return (
    <Component ref={ref} className={className} aria-label={text}>
      {words.map((word, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            display: "inline-block",
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "none" : "translateY(14px)",
            transition: `opacity 0.45s ease-out ${i * stagger}s, transform 0.45s ease-out ${i * stagger}s`,
          }}
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Component>
  );
}

function extractText(node: ReactNode): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (!node) return "";
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (typeof node === "object" && "props" in node) {
    return extractText((node as React.ReactElement<{ children?: ReactNode }>).props.children);
  }
  return "";
}
