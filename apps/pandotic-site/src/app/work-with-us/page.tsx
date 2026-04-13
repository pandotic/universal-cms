import type { Metadata } from "next";
import WorkWithUsContent from "@/components/WorkWithUsContent";

export const metadata: Metadata = {
  title: "Five Ways to Build With Pandotic | AI Product Studio",
  description:
    "Choose your engagement model: license our platform, revenue share, be the founder, fund the build, or make an intro. Pandotic AI builds fast and shares the upside.",
  openGraph: {
    title: "Five Ways to Build With Pandotic | AI Product Studio",
    description:
      "Choose your engagement model: license our platform, revenue share, be the founder, fund the build, or make an intro.",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "Pandotic AI" }],
  },
};

export default function WorkWithUs() {
  return <WorkWithUsContent />;
}
