import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-10 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-start justify-between gap-8">
        <div className="flex items-center gap-3">
          <Image src="/images/pandologo.avif" alt="Pandotic AI" width={32} height={32} className="rounded-full" />
          <div>
            <span className="text-white text-lg font-light tracking-wide">pandotic</span>
            <p className="text-gray-500 text-sm mt-1">AI-first products, workflows, and digital experiences &mdash; built fast.</p>
          </div>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Company</h4>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>
              <Link href="/about-us" className="hover:text-white transition-colors inline-block py-1.5 min-h-[44px] leading-[44px]">About us</Link>
            </li>
            <li>
              <Link href="/work-with-us" className="hover:text-white transition-colors inline-block py-1.5 min-h-[44px] leading-[44px]">Work With Us</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors inline-block py-1.5 min-h-[44px] leading-[44px]">Contact</Link>
            </li>
            <li>
              <Link href="/blog" className="hover:text-white transition-colors inline-block py-1.5 min-h-[44px] leading-[44px]">Blog</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm font-semibold mb-3">Legal</h4>
          <ul className="space-y-1 text-sm text-gray-400">
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors inline-block py-1.5 min-h-[44px] leading-[44px]">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-white transition-colors inline-block py-1.5 min-h-[44px] leading-[44px]">Terms of Service</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 mt-8 pt-6 border-t border-white/10">
        <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} Pandotic AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
