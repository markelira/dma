'use client';

import * as React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface MultiSelectDropdownProps {
  label: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
}

export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
  className,
}: MultiSelectDropdownProps) {
  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const getDisplayText = () => {
    if (selected.length === 0) {
      return placeholder;
    }
    if (selected.length === 1) {
      const selectedOption = options.find((o) => o.value === selected[0]);
      return selectedOption?.label || placeholder;
    }
    return `${selected.length} kiválasztva`;
  };

  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-700 mb-2">
        {label}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg',
              'hover:bg-gray-100 focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary',
              'transition-colors',
              selected.length > 0 && 'text-gray-900',
              selected.length === 0 && 'text-gray-500'
            )}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto"
        >
          {options.map((option) => (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={selected.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
              onSelect={(e) => e.preventDefault()}
            >
              {option.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
