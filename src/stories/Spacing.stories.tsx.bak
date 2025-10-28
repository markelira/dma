import React from 'react';
// import { Meta, StoryObj } from '@storybook/react';

const SPACING = [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32];

const meta = {
  title: 'Design System/Spacing',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
# Spacing & Sizing System

Consistent spacing is critical for a clean, readable, and maintainable UI. Elira uses a 4-based spacing scale, available as both CSS variables and Tailwind utilities.

## Spacing Scale
| Token         | Value   |
|-------------- |---------|
| --space-0     | 0px     |
| --space-1     | 4px     |
| --space-2     | 8px     |
| --space-3     | 12px    |
| --space-4     | 16px    |
| --space-5     | 20px    |
| --space-6     | 24px    |
| --space-8     | 32px    |
| --space-10    | 40px    |
| --space-12    | 48px    |
| --space-14    | 56px    |
| --space-16    | 64px    |
| --space-20    | 80px    |
| --space-24    | 96px    |
| --space-28    | 112px   |
| --space-32    | 128px   |

## Usage
- Use Tailwind utilities: m-4, p-6, gap-8, etc.
- Use CSS variables for custom styles: padding: var(--space-4);
- Avoid hardcoded pixel values for spacing.

## Best Practices
- Use the smallest value that achieves clarity and separation.
- Use consistent vertical rhythm between sections.
- Use gap-* for flex/grid layouts instead of margin hacks.
        `,
      },
    },
  },
};

export default meta;

export const Scale = {
  render: () => (
    <div className="flex flex-wrap gap-8 items-end">
      {SPACING.map((n) => (
        <div key={n} className="flex flex-col items-center">
          <div
            style={{
              width: 48,
              height: n === 0 ? 2 : n * 4,
              background: 'var(--primary)',
              borderRadius: 4,
              marginBottom: 8,
            }}
          />
          <div className="text-xs text-muted-foreground">{`space-${n}`}</div>
          <div className="text-xs text-muted-foreground">{n * 4}px</div>
        </div>
      ))}
    </div>
  ),
  name: 'Spacing Scale',
  parameters: {
    docs: {
      description: {
        story: 'Visual representation of the spacing scale.'
      }
    }
  }
};

export const Utilities = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="mb-2 text-sm font-medium">Margin & Padding Utilities</div>
        <div className="flex gap-8">
          <div className="bg-muted p-4 rounded">
            <div className="bg-primary text-white p-4 m-4 rounded">m-4 p-4</div>
          </div>
          <div className="bg-muted p-6 rounded">
            <div className="bg-primary text-white p-6 m-6 rounded">m-6 p-6</div>
          </div>
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Gap Utilities (Flex/Grid)</div>
        <div className="flex gap-4">
          <div className="flex gap-4">
            <div className="bg-primary text-white p-4 rounded">1</div>
            <div className="bg-primary text-white p-4 rounded">2</div>
            <div className="bg-primary text-white p-4 rounded">3</div>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <div className="bg-primary text-white p-4 rounded">A</div>
            <div className="bg-primary text-white p-4 rounded">B</div>
            <div className="bg-primary text-white p-4 rounded">C</div>
          </div>
        </div>
      </div>
    </div>
  ),
  name: 'Spacing Utilities',
  parameters: {
    docs: {
      description: {
        story: 'Examples of margin, padding, and gap utilities.'
      }
    }
  }
};

export const BestPractices = {
  render: () => (
    <div className="space-y-8">
      <div>
        <div className="mb-2 text-sm font-medium">Do: Use gap utilities for layout</div>
        <div className="flex gap-6">
          <div className="bg-primary text-white p-4 rounded">Item 1</div>
          <div className="bg-primary text-white p-4 rounded">Item 2</div>
          <div className="bg-primary text-white p-4 rounded">Item 3</div>
        </div>
      </div>
      <div>
        <div className="mb-2 text-sm font-medium">Don't: Use margin hacks for layout</div>
        <div className="flex">
          <div className="bg-primary text-white p-4 rounded mr-6">Item 1</div>
          <div className="bg-primary text-white p-4 rounded mr-6">Item 2</div>
          <div className="bg-primary text-white p-4 rounded">Item 3</div>
        </div>
      </div>
    </div>
  ),
  name: 'Best Practices',
  parameters: {
    docs: {
      description: {
        story: 'Best practices for using spacing utilities.'
      }
    }
  }
}; 