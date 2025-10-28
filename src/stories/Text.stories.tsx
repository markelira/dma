import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Text } from '../components/ui/text';

const meta: Meta<typeof Text> = {
  title: 'UI/Text',
  component: Text,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A flexible text component for consistent typography across the application.

## Features
- **Multiple variants**: default, lead, muted, caption, small
- **Flexible sizes**: xs, sm, base, md, lg, xl
- **Weight options**: normal, medium, semibold, bold
- **Custom elements**: p, span, div, label
- **Consistent styling**: Uses the design system typography scale

## Usage
\`\`\`tsx
import { Text } from '@/components/ui/text';

<Text variant="lead">Lead paragraph text</Text>
<Text variant="muted" size="sm">Small muted text</Text>
<Text as="span" weight="semibold">Bold span text</Text>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'lead', 'muted', 'caption', 'small'],
      description: 'The visual variant of the text',
    },
    size: {
      control: { type: 'select' },
      options: ['xs', 'sm', 'base', 'md', 'lg', 'xl'],
      description: 'The size of the text',
    },
    weight: {
      control: { type: 'select' },
      options: ['normal', 'medium', 'semibold', 'bold'],
      description: 'The font weight',
    },
    as: {
      control: { type: 'select' },
      options: ['p', 'span', 'div', 'label'],
      description: 'The HTML element to render',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default text stories
export const Default: Story = {
  args: {
    children: 'Default text content',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Text variant="default">
        Default text - This is the standard text variant used for most content.
      </Text>
      <Text variant="lead">
        Lead text - This is larger text used for introductory paragraphs and important content.
      </Text>
      <Text variant="muted">
        Muted text - This is used for secondary information and less prominent content.
      </Text>
      <Text variant="caption">
        Caption text - This is small, uppercase text used for labels and metadata.
      </Text>
      <Text variant="small">
        Small text - This is smaller text used for fine print and supplementary information.
      </Text>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <Text size="xs">Extra Small (xs) - 12px</Text>
      <Text size="sm">Small (sm) - 14px</Text>
      <Text size="base">Base (base) - 16px</Text>
      <Text size="md">Medium (md) - 18px</Text>
      <Text size="lg">Large (lg) - 20px</Text>
      <Text size="xl">Extra Large (xl) - 24px</Text>
    </div>
  ),
};

export const AllWeights: Story = {
  render: () => (
    <div className="space-y-4">
      <Text weight="normal">Normal weight (400)</Text>
      <Text weight="medium">Medium weight (500)</Text>
      <Text weight="semibold">Semibold weight (600)</Text>
      <Text weight="bold">Bold weight (700)</Text>
    </div>
  ),
};

// Element variations
export const ElementVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <Text as="p">Paragraph element (default)</Text>
      <Text as="span">Span element - inline text</Text>
      <Text as="div">Div element - block text</Text>
      <Text as="label">Label element - form label</Text>
    </div>
  ),
};

// Real-world examples
export const ArticleContent: Story = {
  render: () => (
    <article className="max-w-2xl space-y-6">
      <Text variant="lead">
        Welcome to our comprehensive guide on modern web development. This article will cover the essential concepts and best practices that every developer should know.
      </Text>
      
      <Text>
        Web development has evolved significantly over the past decade. From simple static pages to complex single-page applications, the landscape has changed dramatically. Understanding these changes is crucial for building modern, scalable applications.
      </Text>
      
      <Text>
        The rise of JavaScript frameworks like React, Vue, and Angular has transformed how we build user interfaces. These tools provide powerful abstractions that make development faster and more maintainable.
      </Text>
      
      <Text variant="muted" size="sm">
        Published on March 15, 2024 • 5 min read
      </Text>
    </article>
  ),
};

export const FormLabels: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div>
        <Text as="label" weight="medium" className="block mb-2">
          Email Address
        </Text>
        <input
          type="email"
          className="w-full p-2 border rounded"
          placeholder="Enter your email"
        />
      </div>
      
      <div>
        <Text as="label" weight="medium" className="block mb-2">
          Password
        </Text>
        <input
          type="password"
          className="w-full p-2 border rounded"
          placeholder="Enter your password"
        />
        <Text variant="muted" size="sm" className="mt-1">
          Must be at least 8 characters long
        </Text>
      </div>
      
      <div>
        <Text as="label" weight="medium" className="block mb-2">
          Newsletter
        </Text>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="newsletter" />
          <Text as="label" htmlFor="newsletter" size="sm">
            Subscribe to our newsletter for updates
          </Text>
        </div>
      </div>
    </div>
  ),
};

export const CardContent: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-6 border rounded-lg">
        <Text weight="bold" size="lg" className="mb-2">
          React Fundamentals
        </Text>
        <Text variant="muted" className="mb-4">
          Learn the core concepts of React including components, props, state, and lifecycle methods.
        </Text>
        <div className="flex items-center justify-between">
          <Text variant="caption">4.5 hours</Text>
          <Text variant="caption">Beginner</Text>
        </div>
      </div>
      
      <div className="p-6 border rounded-lg">
        <Text weight="bold" size="lg" className="mb-2">
          Advanced TypeScript
        </Text>
        <Text variant="muted" className="mb-4">
          Master advanced TypeScript features like generics, decorators, and utility types.
        </Text>
        <div className="flex items-center justify-between">
          <Text variant="caption">6.2 hours</Text>
          <Text variant="caption">Advanced</Text>
        </div>
      </div>
    </div>
  ),
};

export const Navigation: Story = {
  render: () => (
    <nav className="flex items-center space-x-6">
      <Text as="span" weight="medium" className="cursor-pointer hover:text-primary">
        Home
      </Text>
      <Text as="span" weight="medium" className="cursor-pointer hover:text-primary">
        Courses
      </Text>
      <Text as="span" weight="medium" className="cursor-pointer hover:text-primary">
        About
      </Text>
      <Text as="span" weight="medium" className="cursor-pointer hover:text-primary">
        Contact
      </Text>
    </nav>
  ),
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [variant, setVariant] = React.useState<'default' | 'lead' | 'muted' | 'caption' | 'small'>('default');
    const [size, setSize] = React.useState<'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl'>('base');
    const [weight, setWeight] = React.useState<'normal' | 'medium' | 'semibold' | 'bold'>('normal');
    const [text, setText] = React.useState('Interactive text example');
    
    return (
      <div className="space-y-6">
        <Text variant={variant} size={size} weight={weight}>
          {text}
        </Text>
        
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Variant:</label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="default">Default</option>
              <option value="lead">Lead</option>
              <option value="muted">Muted</option>
              <option value="caption">Caption</option>
              <option value="small">Small</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Size:</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="xs">Extra Small</option>
              <option value="sm">Small</option>
              <option value="base">Base</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
              <option value="xl">Extra Large</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Weight:</label>
            <select
              value={weight}
              onChange={(e) => setWeight(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="semibold">Semibold</option>
              <option value="bold">Bold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Text:</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter text content"
            />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example where you can change the text variant, size, weight, and content.',
      },
    },
  },
}; 