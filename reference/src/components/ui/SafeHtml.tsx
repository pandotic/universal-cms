"use client";

import DOMPurify from "isomorphic-dompurify";

interface SafeHtmlProps {
  html: string;
  className?: string;
  as?: keyof HTMLElementTagNameMap;
  allowedTags?: string[];
}

// Default allowed tags for CMS content — covers rich text editors
const DEFAULT_ALLOWED_TAGS = [
  "h1", "h2", "h3", "h4", "h5", "h6",
  "p", "br", "hr",
  "strong", "em", "b", "i", "u", "s", "mark", "small", "sub", "sup",
  "a", "img",
  "ul", "ol", "li",
  "blockquote", "pre", "code",
  "table", "thead", "tbody", "tfoot", "tr", "th", "td",
  "div", "span", "section", "article", "figure", "figcaption",
  "video", "source", "iframe",
];

const DEFAULT_ALLOWED_ATTRS = [
  "href", "target", "rel", "src", "alt", "title", "width", "height",
  "class", "id", "style",
  "loading", "decoding",
  "colspan", "rowspan",
  "allow", "allowfullscreen", "frameborder",
  "type", "controls",
];

export function sanitizeHtml(
  dirty: string,
  allowedTags?: string[]
): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: allowedTags ?? DEFAULT_ALLOWED_TAGS,
    ALLOWED_ATTR: DEFAULT_ALLOWED_ATTRS,
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ["target"],
    FORBID_TAGS: ["script", "style", "noscript", "object", "embed", "form", "input", "textarea", "button"],
    FORBID_ATTR: ["onerror", "onclick", "onload", "onmouseover"],
  });
}

export function SafeHtml({
  html,
  className,
  as: Tag = "div",
  allowedTags,
}: SafeHtmlProps) {
  const clean = sanitizeHtml(html, allowedTags);
  return (
    <Tag
      className={className}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
