'use client';

import { useRef, useCallback } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        onChange(val);
      }, 300);
    },
    [onChange]
  );

  return (
    <div className="search-wrapper">
      <span className="search-icon" aria-hidden="true">🔍</span>
      <input
        id="search-input"
        type="search"
        className="search-input"
        placeholder="Search titles, summaries…"
        defaultValue={value}
        onChange={handleChange}
        aria-label="Search your knowledge base"
        autoComplete="off"
      />
    </div>
  );
}
