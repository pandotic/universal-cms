import React from 'react';

/**
 * Search input with icon prefix.
 *
 * Props:
 *   value       - string, current input value
 *   onChange     - function(value), called on input change
 *   placeholder - string (default: 'Search...')
 *   icon        - ReactNode (optional), custom icon (defaults to magnifying glass)
 *   className   - string (optional), additional classes on wrapper
 */
export default function SearchInput({ value, onChange, placeholder = 'Search...', icon, className = '' }) {
  const defaultIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  );

  return (
    <div className={`relative ${className}`}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        {icon || defaultIcon}
      </div>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
      />
    </div>
  );
}
