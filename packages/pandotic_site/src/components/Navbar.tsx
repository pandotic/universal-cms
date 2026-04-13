"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Focus trap and Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!mobileOpen) return;

      if (e.key === "Escape") {
        setMobileOpen(false);
        toggleRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && menuRef.current) {
        const focusable = menuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [mobileOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Move focus into menu when opened
  useEffect(() => {
    if (mobileOpen && menuRef.current) {
      const firstLink = menuRef.current.querySelector<HTMLElement>("a[href]");
      firstLink?.focus();
    }
  }, [mobileOpen]);

  const links = [
    { href: "/why-pandotic", label: "Why Pandotic?" },
    { href: "/about-us", label: "Meet your Team" },
    { href: "/projects", label: "Projects" },
    { href: "/work-with-us", label: "Work With Us" },
    { href: "/blog", label: "Blog" },
  ];

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2" aria-label="Pandotic AI — Home">
          <Image src="/images/pandologo.avif" alt="Pandotic AI" width={32} height={32} className="rounded-full" />
          <span className="text-white text-lg font-light tracking-wide">pandotic</span>
        </Link>

        <div className="hidden md:flex items-center gap-5 lg:gap-8">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                isActive(link.href)
                  ? "text-white font-semibold"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/contact"
          className={`hidden md:inline-block text-sm border px-5 py-2 rounded-full transition-colors ${
            isActive("/contact")
              ? "border-white text-white bg-white/10"
              : "border-white/50 text-white hover:bg-white/10"
          }`}
        >
          Contact us
        </Link>

        <button
          ref={toggleRef}
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu with backdrop */}
      <div
        className={`md:hidden fixed inset-0 top-[65px] z-40 transition-opacity duration-300 ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />

        {/* Menu panel */}
        <div
          ref={menuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          className={`relative bg-black/95 border-t border-white/10 px-4 py-6 space-y-1 transition-transform duration-300 ${
            mobileOpen ? "translate-y-0" : "-translate-y-4"
          }`}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block py-3 px-3 rounded-lg text-base transition-colors min-h-[44px] ${
                isActive(link.href)
                  ? "text-white bg-white/10 font-semibold"
                  : "text-gray-300 hover:text-white hover:bg-white/5"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className={`block py-3 px-3 rounded-lg text-base transition-colors min-h-[44px] ${
              isActive("/contact")
                ? "text-white bg-white/10 font-semibold"
                : "text-gray-300 hover:text-white hover:bg-white/5"
            }`}
          >
            Contact us
          </Link>
        </div>
      </div>
    </nav>
  );
}
