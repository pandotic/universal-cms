import React from 'react';

/**
 * Small inline badge/pill for status, category, or version display.
 *
 * Props:
 *   children  - string or ReactNode, badge content
 *   variant   - 'default' | 'blue' | 'purple' | 'amber' | 'green' | 'red' (default: 'default')
 *   size      - 'sm' | 'md' (default: 'sm')
 *   mono      - boolean, use monospace font (good for versions/codes)
 */
export default function Badge({ children, variant = 'default', size = 'sm', mono = false }) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    blue:    'bg-blue-50 text-blue-700',
    purple:  'bg-purple-50 text-purple-700',
    amber:   'bg-amber-50 text-amber-700',
    green:   'bg-green-50 text-green-700',
    red:     'bg-red-50 text-red-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  return (
    <span className={`inline-block font-medium rounded-full ${variants[variant]} ${sizes[size]} ${mono ? 'font-mono' : ''}`}>
      {children}
    </span>
  );
}
