import React from 'react';

/**
 * Underline-style tab navigation.
 *
 * Props:
 *   tabs      - Array of { key: string, label: string }
 *   activeTab - string, currently active tab key
 *   onChange  - function(key), called when a tab is clicked
 *   className - string (optional), additional classes on wrapper
 */
export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={`flex border-b border-gray-100 ${className}`}>
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            activeTab === key
              ? 'border-purple-600 text-purple-700'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
