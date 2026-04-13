import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  metadataBase: new URL("https://pandotic.ai"),
  title: {
    default: "Pandotic AI",
    template: "%s | Pandotic AI",
  },
  description:
    "Pandotic AI builds intelligent, supervised, agent-based AI systems that give your team superpowers. We combine the speed of a venture studio with the strategy of exited founders.",
  keywords: ["AI", "artificial intelligence", "agentic AI", "automation", "digital transformation", "venture studio"],
  openGraph: {
    siteName: "Pandotic AI",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pandotic AI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pandotic AI",
    description:
      "Pandotic AI builds intelligent, supervised, agent-based AI systems that give your team superpowers.",
    images: ["/images/og-image.png"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Pandotic AI",
  url: "https://pandotic.ai",
  logo: "https://pandotic.ai/images/pandologo.avif",
  description:
    "Pandotic AI builds intelligent, supervised, agent-based AI systems that give your team superpowers.",
  sameAs: [],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-[var(--color-accent)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" className="pt-16">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
