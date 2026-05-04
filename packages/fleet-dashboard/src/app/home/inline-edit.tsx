"use client";

import { useState } from "react";

export function InlineSelect({
  value,
  options,
  onChange,
  className = "",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (val: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        e.stopPropagation();
        onChange(e.target.value);
      }}
      onClick={(e) => e.stopPropagation()}
      className={`rounded border-0 bg-transparent py-0 pl-0 pr-5 text-xs focus:ring-1 focus:ring-zinc-600 cursor-pointer ${className}`}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-zinc-800">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function InlineText({
  value,
  placeholder,
  onSave,
  className = "",
}: {
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
  className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (editing) {
    return (
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onClick={(e) => e.stopPropagation()}
        onBlur={() => {
          if (draft !== value) onSave(draft);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            if (draft !== value) onSave(draft);
            setEditing(false);
          }
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        autoFocus
        className="w-full rounded border border-zinc-600 bg-zinc-800 px-1.5 py-0.5 text-xs text-zinc-300 focus:border-zinc-500 focus:outline-none"
      />
    );
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setDraft(value);
        setEditing(true);
      }}
      className={`text-left text-xs hover:text-white ${className}`}
      title="Click to edit"
    >
      {value || <span className="text-zinc-600">{placeholder}</span>}
    </button>
  );
}
