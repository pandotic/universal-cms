export interface BlogPost {
  slug: string;
  title: string;
  author: string;
  date: string;
  image: string;
  category?: string;
  excerpt?: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "robin-sel",
    title: "Robin SEL: A Case Study",
    author: "Scott Farber",
    date: "Apr 22, 2025",
    image: "/images/blog/robin.webp",
    category: "EdTech",
    excerpt: "Pandotic partnered with ROBIN to build an AI-powered curriculum engine that learns from each district's standards.",
  },
  {
    slug: "the-roots-of-pandotic-ai",
    title: "The Roots of Pandotic AI",
    author: "Matt Golden",
    date: "Jan 22, 2025",
    image: "/images/hero-backdrop.webp",
    excerpt: "The name Pandotic comes from two powerful sources of inspiration: the Pando tree and the concept of agentic intelligence.",
  },
  {
    slug: "supervised-ai",
    title: "Supervised AI: Giving Humans Superpowers",
    author: "Matt Golden",
    date: "Feb 17, 2025",
    image: "/images/blog/supervised-ai.avif",
    excerpt: "At Pandotic AI, we design agentic AI systems that work alongside people, not in place of them.",
  },
  {
    slug: "blue-collar-ai",
    title: "Blue Collar AI: Real Solutions for Real User Needs",
    author: "Dan Golden",
    date: "Mar 17, 2025",
    image: "/images/blog/blue-collar-ai.webp",
    excerpt: "At Pandotic AI, we're not just imagining the future of artificial intelligence—we're building it into everyday business operations right now.",
  },
];
