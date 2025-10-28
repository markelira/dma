import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Heading } from '../components/ui/heading';

const meta: Meta<typeof Heading> = {
  title: 'UI/Heading',
  component: Heading,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A flexible heading component for consistent typography across the application.

## Features
- **Multiple levels**: h1-h6 with proper semantic HTML
- **Flexible variants**: default, display, section, subtitle
- **Custom elements**: Override the HTML element with the 'as' prop
- **Consistent styling**: Uses the design system typography scale
- **Accessibility**: Proper heading hierarchy and ARIA support

## Usage
\`\`\`tsx
import { Heading } from '@/components/ui/heading';

<Heading level={1}>Main Page Title</Heading>
<Heading level={2} variant="section">Section Title</Heading>
<Heading level={3} as="h2" variant="subtitle">Subtitle</Heading>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    level: {
      control: { type: 'select' },
      options: [1, 2, 3, 4, 5, 6],
      description: 'The heading level (h1-h6)',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'display', 'section', 'subtitle'],
      description: 'The visual variant of the heading',
    },
    as: {
      control: { type: 'select' },
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
      description: 'Override the HTML element',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default heading stories
export const Default: Story = {
  args: {
    children: 'Default Heading',
    level: 1,
  },
};

export const AllLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={1}>Heading Level 1</Heading>
      <Heading level={2}>Heading Level 2</Heading>
      <Heading level={3}>Heading Level 3</Heading>
      <Heading level={4}>Heading Level 4</Heading>
      <Heading level={5}>Heading Level 5</Heading>
      <Heading level={6}>Heading Level 6</Heading>
    </div>
  ),
};

// Variant stories
export const Display: Story = {
  args: {
    children: 'Display Heading',
    level: 1,
    variant: 'display',
  },
};

export const Section: Story = {
  args: {
    children: 'Section Heading',
    level: 2,
    variant: 'section',
  },
};

export const Subtitle: Story = {
  args: {
    children: 'Subtitle Heading',
    level: 3,
    variant: 'subtitle',
  },
};

// All variants comparison
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Default Variant</h3>
        <div className="space-y-2">
          <Heading level={1} variant="default">Default H1</Heading>
          <Heading level={2} variant="default">Default H2</Heading>
          <Heading level={3} variant="default">Default H3</Heading>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Display Variant</h3>
        <div className="space-y-2">
          <Heading level={1} variant="display">Display H1</Heading>
          <Heading level={2} variant="display">Display H2</Heading>
          <Heading level={3} variant="display">Display H3</Heading>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Section Variant</h3>
        <div className="space-y-2">
          <Heading level={1} variant="section">Section H1</Heading>
          <Heading level={2} variant="section">Section H2</Heading>
          <Heading level={3} variant="section">Section H3</Heading>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Subtitle Variant</h3>
        <div className="space-y-2">
          <Heading level={1} variant="subtitle">Subtitle H1</Heading>
          <Heading level={2} variant="subtitle">Subtitle H2</Heading>
          <Heading level={3} variant="subtitle">Subtitle H3</Heading>
        </div>
      </div>
    </div>
  ),
};

// Real-world examples
export const PageHeader: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={1} variant="display">
        Welcome to DMA
      </Heading>
      <Heading level={2} variant="subtitle">
        Your journey to professional growth starts here
      </Heading>
    </div>
  ),
};

export const CourseSection: Story = {
  render: () => (
    <div className="space-y-6">
      <Heading level={2} variant="section">
        Featured Courses
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <Heading level={3} variant="default">React Fundamentals</Heading>
          <p className="text-muted-foreground mt-2">
            Learn the basics of React development
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <Heading level={3} variant="default">TypeScript Mastery</Heading>
          <p className="text-muted-foreground mt-2">
            Master TypeScript for better code quality
          </p>
        </div>
      </div>
    </div>
  ),
};

export const FormSection: Story = {
  render: () => (
    <div className="space-y-4">
      <Heading level={2} variant="section">
        Contact Information
      </Heading>
      <Heading level={3} variant="subtitle">
        Please provide your details below
      </Heading>
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Form fields would go here...
        </p>
      </div>
    </div>
  ),
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [level, setLevel] = React.useState<1 | 2 | 3 | 4 | 5 | 6>(1);
    const [variant, setVariant] = React.useState<'default' | 'display' | 'section' | 'subtitle'>('default');
    const [text, setText] = React.useState('Interactive Heading');
    
    return (
      <div className="space-y-6">
        <Heading level={level} variant={variant}>
          {text}
        </Heading>
        
        <div className="space-y-4 p-4 border rounded-lg">
          <div>
            <label className="block text-sm font-medium mb-2">Level:</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6)}
              className="w-full p-2 border rounded"
            >
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
              <option value={4}>H4</option>
              <option value={5}>H5</option>
              <option value={6}>H6</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Variant:</label>
            <select
              value={variant}
              onChange={(e) => setVariant(e.target.value as any)}
              className="w-full p-2 border rounded"
            >
              <option value="default">Default</option>
              <option value="display">Display</option>
              <option value="section">Section</option>
              <option value="subtitle">Subtitle</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Text:</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="Enter heading text"
            />
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example where you can change the heading level, variant, and text.',
      },
    },
  },
}; 