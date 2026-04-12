import React, { useState } from 'react';

/**
 * Code/text block with a copy-to-clipboard button.
 *
 * Props:
 *   text      - string, the content to display and copy
 *   label     - string (optional), small label above the block
 *   className - string (optional), additional classes
 */
export default function CopyBlock({ text, label, className = '' }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const checkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  );
  const copyIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
  );

  return (
    <div className={className}>
      {label && <p className="text-xs text-gray-500 mb-1">{label}</p>}
      <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
        <code className="text-xs font-mono text-gray-800 flex-1 break-all">{text}</code>
        <button
          onClick={copy}
          className="flex-shrink-0 text-gray-400 hover:text-purple-600 transition-colors p-1"
          title="Copy to clipboard"
        >
          {copied ? checkIcon : copyIcon}
        </button>
      </div>
    </div>
  );
}
