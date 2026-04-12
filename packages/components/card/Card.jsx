import React from 'react';

/**
 * Content card with optional icon, title, badge, description, and tags.
 *
 * Props:
 *   title       - string, card heading
 *   description - string, body text (clamped to 3 lines)
 *   icon        - ReactNode (optional), displayed top-left
 *   badge       - string (optional), category/status badge
 *   badgeColor  - { bg, text } Tailwind classes for badge (default: gray)
 *   tags        - string[] (optional), small tag pills
 *   selected    - boolean, shows selection ring
 *   onClick     - function (optional), makes card clickable
 *   children    - ReactNode (optional), custom content below description
 */
export default function Card({
  title,
  description,
  icon,
  badge,
  badgeColor = { bg: 'bg-gray-100', text: 'text-gray-700' },
  tags = [],
  selected = false,
  onClick,
  children,
}) {
  return (
    <div
      onClick={onClick}
      className={[
        'rounded-2xl border-2 bg-white p-5 transition-all duration-150',
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg' : '',
        selected ? 'border-purple-500 shadow-[0_0_0_2px_#9333ea,0_8px_24px_-4px_rgba(147,51,234,0.18)]' : 'border-gray-200 hover:border-gray-300',
      ].join(' ')}
    >
      {/* Header row: icon + optional checkbox/action area */}
      {icon && (
        <div className="mb-3">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>

      {/* Badge */}
      {badge && (
        <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${badgeColor.bg} ${badgeColor.text} mb-2`}>
          {badge}
        </span>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 leading-relaxed mb-3 line-clamp-3">{description}</p>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(t => (
            <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">{t}</span>
          ))}
        </div>
      )}

      {children}
    </div>
  );
}
