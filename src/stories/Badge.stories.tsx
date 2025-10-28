import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from '../components/ui/badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile badge component for displaying status, metrics, and labels.

## Features
- **Multiple variants**: status, metric
- **Color options**: teal, purple, orange, blue, green, red, yellow
- **Flexible content**: Text, icons, or both
- **Responsive design**: Adapts to content size

## Usage
\`\`\`tsx
import { Badge } from '@/components/ui/badge';

// Status badge
<Badge variant="status" color="green">Active</Badge>

// Metric badge
<Badge variant="metric">1.2k</Badge>

// With custom color
<Badge color="purple">Premium</Badge>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['status', 'metric'],
      description: 'The visual style variant of the badge',
    },
    color: {
      control: { type: 'select' },
      options: ['teal', 'purple', 'orange', 'blue', 'green', 'red', 'yellow'],
      description: 'The color theme of the badge',
    },
    children: {
      control: { type: 'text' },
      description: 'The content to display in the badge',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic badge stories
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Status: Story = {
  args: {
    variant: 'status',
    color: 'teal',
    children: 'Active',
  },
};

export const Metric: Story = {
  args: {
    variant: 'metric',
    children: '1.2k',
  },
};

// Color variants
export const Teal: Story = {
  args: {
    color: 'teal',
    children: 'Teal Badge',
  },
};

export const Purple: Story = {
  args: {
    color: 'purple',
    children: 'Purple Badge',
  },
};

export const Orange: Story = {
  args: {
    color: 'orange',
    children: 'Orange Badge',
  },
};

export const Blue: Story = {
  args: {
    color: 'blue',
    children: 'Blue Badge',
  },
};

export const Green: Story = {
  args: {
    color: 'green',
    children: 'Green Badge',
  },
};

export const Red: Story = {
  args: {
    color: 'red',
    children: 'Red Badge',
  },
};

export const Yellow: Story = {
  args: {
    color: 'yellow',
    children: 'Yellow Badge',
  },
};

// Status examples
export const StatusExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="status" color="green">Active</Badge>
      <Badge variant="status" color="red">Inactive</Badge>
      <Badge variant="status" color="yellow">Pending</Badge>
      <Badge variant="status" color="blue">Processing</Badge>
      <Badge variant="status" color="purple">Premium</Badge>
      <Badge variant="status" color="orange">Warning</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common status badge examples with different colors.',
      },
    },
  },
};

// Metric examples
export const MetricExamples: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="metric">1.2k</Badge>
      <Badge variant="metric">5.4k</Badge>
      <Badge variant="metric">12.8k</Badge>
      <Badge variant="metric">99+</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Metric badges for displaying numbers and statistics.',
      },
    },
  },
};

// Course category badges
export const CourseCategories: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge color="green">Technology</Badge>
      <Badge color="blue">Business</Badge>
      <Badge color="purple">Design</Badge>
      <Badge color="orange">Marketing</Badge>
      <Badge color="red">Finance</Badge>
      <Badge color="yellow">Health</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Badges used for categorizing courses and content.',
      },
    },
  },
};

// User status badges
export const UserStatus: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="status" color="green">Online</Badge>
      <Badge variant="status" color="red">Offline</Badge>
      <Badge variant="status" color="yellow">Away</Badge>
      <Badge variant="status" color="blue">Busy</Badge>
      <Badge variant="status" color="purple">Premium</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'User status indicators with appropriate colors.',
      },
    },
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [selectedColor, setSelectedColor] = React.useState<'teal' | 'purple' | 'orange' | 'blue' | 'green' | 'red' | 'yellow'>('teal');
    const [selectedVariant, setSelectedVariant] = React.useState<'status' | 'metric'>('status');
    
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={selectedVariant} color={selectedColor}>
            Interactive Badge
          </Badge>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Color:</label>
          <div className="flex flex-wrap gap-1">
            {(['teal', 'purple', 'orange', 'blue', 'green', 'red', 'yellow'] as const).map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-6 h-6 rounded-full border-2 ${
                  selectedColor === color ? 'border-gray-900' : 'border-gray-300'
                }`}
                style={{ backgroundColor: getColorValue(color) }}
              />
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Variant:</label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedVariant('status')}
              className={`px-3 py-1 rounded text-sm ${
                selectedVariant === 'status' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Status
            </button>
            <button
              onClick={() => setSelectedVariant('metric')}
              className={`px-3 py-1 rounded text-sm ${
                selectedVariant === 'metric' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              Metric
            </button>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive badge example where you can change the color and variant.',
      },
    },
  },
};

// Helper function for color values
function getColorValue(color: string): string {
  const colorMap: Record<string, string> = {
    teal: '#0F766E',
    purple: '#7C3AED',
    orange: '#F97316',
    blue: '#2563EB',
    green: '#10B981',
    red: '#EF4444',
    yellow: '#F59E0B',
  };
  return colorMap[color] || '#0F766E';
} 