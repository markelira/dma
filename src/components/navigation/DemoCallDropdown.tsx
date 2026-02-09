'use client';

interface DemoCallDropdownProps {
  isOpen: boolean;
}

const DEMO_OPTIONS = [
  {
    label: 'Több mint 10 munkatársam van',
    href: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0WDMeHgQ6wnoSeA4BwFB_d7HZmY7MH5LKDh34jFBub-e_IS-P80UwEt45pIhZivl5Teqohq4fW',
  },
  {
    label: 'Kevesebb mint 10 munkatársam van',
    href: 'https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0HsL5YiflB-dp9Uws8SJi8MLV20PtubjFtSuhefRwXtjTbW-ABbBl7DPenQ5_I_YFjv7DHaanq',
  },
];

export function DemoCallDropdown({ isOpen }: DemoCallDropdownProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 w-72 z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2">
        {DEMO_OPTIONS.map((option) => (
          <a
            key={option.label}
            href={option.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">{option.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
