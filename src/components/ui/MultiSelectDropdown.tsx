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
  isDark?: boolean;
}

export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
  className,
  isDark = false,
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
      <label className={cn(
        "block text-xs font-medium mb-2",
        isDark ? "text-gray-300" : "text-gray-700"
      )}>
        {label}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg',
              'focus:outline-none focus:border-brand-secondary focus:ring-1 focus:ring-brand-secondary',
              'transition-colors',
              isDark
                ? 'bg-gray-900/80 border-white/20 hover:bg-gray-900 hover:border-white/40'
                : 'bg-gray-50 border-gray-200 hover:bg-gray-100',
              isDark
                ? selected.length > 0 ? 'text-white' : 'text-gray-400'
                : selected.length > 0 ? 'text-gray-900' : 'text-gray-500'
            )}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronDown className={cn(
              "w-4 h-4 flex-shrink-0 ml-2",
              isDark ? "text-gray-400" : "text-gray-400"
            )} />
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
