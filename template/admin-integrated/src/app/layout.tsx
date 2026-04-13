import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Admin Integrated Template",
  description:
    "Example Next.js app demonstrating @pandotic/admin-ui integration",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white">{children}</body>
    </html>
  );
}
