import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Button, IconButton, LoadingButton } from '../components/ui/button';
import { 
  Play, 
  Download, 
  Star, 
  Heart, 
  Settings, 
  Plus,
  ArrowRight,
  Check,
  X
} from 'lucide-react';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A versatile button component with multiple variants, sizes, and states inspired by Apple's design principles.

## Features
- **Multiple variants**: Default, destructive, outline, secondary, ghost, link, apple, gradient, premium, glass, success, warning
- **Flexible sizing**: Small, default, large, extra large, and icon sizes
- **Loading states**: Built-in loading spinner with disabled state
- **Icon support**: Left and right icons with proper spacing
- **Accessibility**: Proper focus states, ARIA attributes, and keyboard navigation
- **Animations**: Subtle hover and active state animations

## Usage
\`\`\`tsx
import { Button, IconButton, LoadingButton } from '@/components/ui/button';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="apple">Apple Style</Button>
<Button variant="gradient">Gradient</Button>

// With icons
<Button leftIcon={<Download />}>Download</Button>
<Button rightIcon={<ArrowRight />}>Continue</Button>

// Loading state
<LoadingButton>Processing...</LoadingButton>

// Icon only
<IconButton icon={<Settings />} variant="ghost" />
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: [
        'default', 'destructive', 'outline', 'secondary', 'ghost', 'link',
        'apple', 'gradient', 'premium', 'glass', 'success', 'warning'
      ],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'default', 'lg', 'xl', 'icon', 'iconSm', 'iconLg'],
      description: 'The size of the button',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the button is in a loading state',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
    },
    leftIcon: {
      control: false,
      description: 'Icon to display on the left side of the button',
    },
    rightIcon: {
      control: false,
      description: 'Icon to display on the right side of the button',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic button stories
export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

// Apple-inspired variants
export const Apple: Story = {
  args: {
    variant: 'apple',
    children: 'Apple Style',
  },
  parameters: {
    docs: {
      description: {
        story: 'Apple-inspired button with clean white background and subtle shadows.',
      },
    },
  },
};

export const Gradient: Story = {
  args: {
    variant: 'gradient',
    children: 'Gradient',
  },
  parameters: {
    docs: {
      description: {
        story: 'Gradient button using primary to secondary color transition.',
      },
    },
  },
};

export const Premium: Story = {
  args: {
    variant: 'premium',
    children: 'Premium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Premium button with amber to red gradient for high-value actions.',
      },
    },
  },
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: 'Glass Effect',
  },
  parameters: {
    background: { default: 'gradient' },
    docs: {
      description: {
        story: 'Glassmorphic button with backdrop blur and transparency.',
      },
    },
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Success',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Warning',
  },
};

// Size variants
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

export const ExtraLarge: Story = {
  args: {
    size: 'xl',
    children: 'Extra Large',
  },
};

// Icon buttons
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <Download className="h-4 w-4" />,
    children: 'Download',
  },
};

export const WithRightIcon: Story = {
  args: {
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'Continue',
  },
};

export const WithBothIcons: Story = {
  args: {
    leftIcon: <Play className="h-4 w-4" />,
    rightIcon: <ArrowRight className="h-4 w-4" />,
    children: 'Play Video',
  },
};

// Loading states
export const Loading: Story = {
  args: {
    loading: true,
    children: 'Processing...',
  },
};

export const LoadingWithIcon: Story = {
  args: {
    loading: true,
    leftIcon: <Download className="h-4 w-4" />,
    children: 'Downloading...',
  },
};

// Disabled states
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

export const DisabledLoading: Story = {
  args: {
    disabled: true,
    loading: true,
    children: 'Disabled Loading',
  },
};

// Icon-only buttons
export const IconOnly: Story = {
  args: {
    size: 'icon',
    children: <Settings className="h-4 w-4" />,
  },
};

export const IconOnlySmall: Story = {
  args: {
    size: 'iconSm',
    children: <Heart className="h-3 w-3" />,
  },
};

export const IconOnlyLarge: Story = {
  args: {
    size: 'iconLg',
    children: <Plus className="h-6 w-6" />,
  },
};

// Interactive examples
export const Interactive: Story = {
  args: {
    variant: 'gradient',
    size: 'lg',
    leftIcon: <Star className="h-5 w-5" />,
    rightIcon: <ArrowRight className="h-5 w-5" />,
    children: 'Get Started',
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example showing a call-to-action button with icons.',
      },
    },
  },
};

// Button group example
export const ButtonGroup: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="default">Default</Button>
      <Button variant="apple">Apple</Button>
      <Button variant="gradient">Gradient</Button>
      <Button variant="premium">Premium</Button>
      <Button variant="glass">Glass</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different button variants.',
      },
    },
  },
};

// Size comparison
export const SizeComparison: Story = {
  render: () => (
    <div className="flex gap-4 items-center flex-wrap">
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Comparison of different button sizes.',
      },
    },
  },
};

// IconButton stories
export const IconButtonExample: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <IconButton icon={<Settings />} variant="ghost" />
      <IconButton icon={<Heart />} variant="outline" />
      <IconButton icon={<Star />} variant="default" />
      <IconButton icon={<Plus />} variant="gradient" size="lg" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'IconButton component for icon-only interactions.',
      },
    },
  },
};

// LoadingButton stories
export const LoadingButtonExample: Story = {
  render: () => (
    <div className="flex gap-4 items-center">
      <LoadingButton variant="default">Processing</LoadingButton>
      <LoadingButton variant="gradient">Uploading</LoadingButton>
      <LoadingButton variant="premium">Saving</LoadingButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'LoadingButton component for immediate loading states.',
      },
    },
  },
}; 