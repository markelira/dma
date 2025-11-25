import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Spinner } from '../components/ui/spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A loading spinner component with multiple sizes and customizable styling.

## Features
- **Multiple sizes**: Small, medium, large
- **Consistent styling**: Uses primary color by default
- **Customizable**: Accepts custom className for styling
- **Accessible**: Proper ARIA attributes for screen readers

## Usage
\`\`\`tsx
import { Spinner } from '@/components/ui/spinner';

// Basic usage
<Spinner />

// Different sizes
<Spinner size="sm" />
<Spinner size="md" />
<Spinner size="lg" />

// Custom styling
        <Spinner className="text-teal-500" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the spinner',
    },
    className: {
      control: { type: 'text' },
      description: 'Additional CSS classes for custom styling',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic spinner stories
export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

// Size comparison
export const SizeComparison: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner size="sm" />
        <span className="text-sm text-muted-foreground">Small</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="md" />
        <span className="text-sm text-muted-foreground">Medium</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner size="lg" />
        <span className="text-sm text-muted-foreground">Large</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of all spinner sizes.',
      },
    },
  },
};

// Color variants
export const ColorVariants: Story = {
  render: () => (
    <div className="flex items-center gap-8">
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-primary" />
        <span className="text-sm text-muted-foreground">Primary</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-primary" />
        <span className="text-sm text-muted-foreground">Blue</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-green-500" />
        <span className="text-sm text-muted-foreground">Green</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-red-500" />
        <span className="text-sm text-muted-foreground">Red</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <Spinner className="text-purple-500" />
        <span className="text-sm text-muted-foreground">Purple</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spinner with different colors using custom className.',
      },
    },
  },
};

// Loading states
export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Spinner size="sm" />
        <span>Loading small content...</span>
      </div>
      
      <div className="flex items-center gap-4">
        <Spinner size="md" />
        <span>Loading medium content...</span>
      </div>
      
      <div className="flex items-center gap-4">
        <Spinner size="lg" />
        <span>Loading large content...</span>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Common loading state examples with different spinner sizes.',
      },
    },
  },
};

// Button loading state
export const ButtonLoading: Story = {
  render: () => (
    <div className="flex gap-4">
      <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg">
        <Spinner size="sm" className="text-white" />
        <span>Loading...</span>
      </button>
      
      <button className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg">
        <Spinner size="sm" className="text-gray-700" />
        <span>Processing...</span>
      </button>
      
      <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg">
        <Spinner size="sm" className="text-white" />
        <span>Saving...</span>
      </button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spinner used within buttons for loading states.',
      },
    },
  },
};

// Card loading state
export const CardLoading: Story = {
  render: () => (
    <div className="w-[300px] p-6 border rounded-lg">
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading course content...</p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Spinner used in a card layout for content loading.',
      },
    },
  },
};

// Page loading state
export const PageLoading: Story = {
  render: () => (
    <div className="min-h-[200px] flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">Loading Page</h3>
        <p className="text-muted-foreground">Please wait while we prepare your content...</p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Full page loading state with spinner and descriptive text.',
      },
    },
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [selectedSize, setSelectedSize] = React.useState<'sm' | 'md' | 'lg'>('md');
    const [selectedColor, setSelectedColor] = React.useState('text-primary');
    
    const handleToggleLoading = () => {
      setIsLoading(!isLoading);
    };
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center min-h-[100px] border rounded-lg">
          {isLoading ? (
            <Spinner size={selectedSize} className={selectedColor} />
          ) : (
            <span className="text-muted-foreground">Content loaded</span>
          )}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Size:</label>
            <div className="flex gap-2">
              {(['sm', 'md', 'lg'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedSize === size 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {size.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Color:</label>
            <div className="flex gap-2">
              {[
                { name: 'Primary', value: 'text-primary' },
                { name: 'Blue', value: 'text-primary' },
                { name: 'Green', value: 'text-green-500' },
                { name: 'Red', value: 'text-red-500' },
              ].map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedColor === color.value 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={handleToggleLoading}
            className="px-4 py-2 bg-primary text-white rounded-lg"
          >
            {isLoading ? 'Stop Loading' : 'Start Loading'}
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example where you can change the spinner size, color, and toggle loading state.',
      },
    },
  },
}; 