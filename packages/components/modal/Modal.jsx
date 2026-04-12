import React from 'react';

/**
 * Reusable modal overlay with header, scrollable content, and optional footer.
 *
 * Props:
 *   isOpen    - boolean, controls visibility
 *   onClose   - function, called on backdrop click or X button
 *   title     - string, modal header text
 *   subtitle  - string (optional), smaller text below title
 *   size      - 'sm' | 'md' | 'lg' (default: 'md')
 *   children  - modal body content
 *   footer    - ReactNode (optional), rendered below content
 */
export default function Modal({ isOpen, onClose, title, subtitle, size = 'md', children, footer }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[85vh] flex flex-col animate-fade-in`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-900 p-1 transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-5">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-gray-100 p-5 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
