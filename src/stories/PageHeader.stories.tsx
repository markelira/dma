import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { PageHeader } from '../components/ui/page-header';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ChevronRight, Plus, Download, Settings } from 'lucide-react';

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A flexible page header component for consistent page titles and layouts.

## Features
- **Multiple variants**: default, centered, minimal
- **Flexible sizing**: Small, medium, large
- **Action buttons**: Support for action buttons and breadcrumbs
- **Responsive design**: Adapts to different screen sizes
- **Semantic structure**: Proper heading hierarchy

## Usage
\`\`\`tsx
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';

<PageHeader
  title="Page Title"
  description="Page description goes here"
  actions={<Button>Action</Button>}
/>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'The main page title',
    },
    description: {
      control: { type: 'text' },
      description: 'Optional page description',
    },
    variant: {
      control: { type: 'select' },
      options: ['default', 'centered', 'minimal'],
      description: 'The layout variant of the header',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the header',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic page header stories
export const Default: Story = {
  args: {
    title: 'Dashboard',
    description: 'Welcome back! Here\'s what\'s happening with your courses.',
  },
};

export const WithActions: Story = {
  args: {
    title: 'Courses',
    description: 'Manage your course catalog and content.',
    actions: (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Course
        </Button>
      </div>
    ),
  },
};

export const Centered: Story = {
  args: {
    title: 'Welcome to DMA',
    description: 'Your journey to professional growth starts here.',
    variant: 'centered',
    size: 'lg',
  },
};

export const Minimal: Story = {
  args: {
    title: 'Settings',
    description: 'Configure your account preferences.',
    variant: 'minimal',
    size: 'sm',
    actions: (
      <Button variant="ghost" size="sm">
        <Settings className="w-4 h-4" />
      </Button>
    ),
  },
};

// Size variants
export const Small: Story = {
  args: {
    title: 'Small Header',
    description: 'Compact header for simple pages.',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    title: 'Large Header',
    description: 'Prominent header for important pages.',
    size: 'lg',
  },
};

// With breadcrumbs
export const WithBreadcrumbs: Story = {
  args: {
    title: 'Course Details',
    description: 'View and edit course information.',
    breadcrumbs: (
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground">Courses</a>
        <ChevronRight className="w-4 h-4" />
        <a href="#" className="hover:text-foreground">Programming</a>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">React Fundamentals</span>
      </nav>
    ),
    actions: (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Preview</Button>
        <Button size="sm">Edit Course</Button>
      </div>
    ),
  },
};

// Dashboard example
export const Dashboard: Story = {
  args: {
    title: 'Dashboard',
    description: 'Track your progress and manage your learning journey.',
    actions: (
      <div className="flex items-center gap-2">
        <Badge variant="status" color="green">Active</Badge>
        <Button variant="outline" size="sm">View Reports</Button>
        <Button size="sm">Continue Learning</Button>
      </div>
    ),
  },
};

// Course creation example
export const CourseCreation: Story = {
  args: {
    title: 'Create New Course',
    description: 'Set up your course structure and content.',
    variant: 'centered',
    size: 'lg',
    actions: (
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">Save Draft</Button>
        <Button size="sm">Publish Course</Button>
      </div>
    ),
  },
};

// User profile example
export const UserProfile: Story = {
  args: {
    title: 'Profile Settings',
    description: 'Update your personal information and preferences.',
    variant: 'minimal',
    actions: (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm">Cancel</Button>
        <Button size="sm">Save Changes</Button>
      </div>
    ),
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [variant, setVariant] = React.useState<'default' | 'centered' | 'minimal'>('default');
    const [size, setSize] = React.useState<'sm' | 'md' | 'lg'>('md');
    const [showActions, setShowActions] = React.useState(true);
    const [showDescription, setShowDescription] = React.useState(true);
    
    return (
      <div className="space-y-6">
        <PageHeader
          title="Interactive Header"
          description={showDescription ? "This header demonstrates all the available options." : undefined}
          variant={variant}
          size={size}
          actions={showActions ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">Action 1</Button>
              <Button size="sm">Action 2</Button>
            </div>
          ) : undefined}
        />
        
        <div className="container mx-auto px-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Variant:</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="default">Default</option>
                <option value="centered">Centered</option>
                <option value="minimal">Minimal</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Size:</label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Actions:</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showActions}
                  onChange={(e) => setShowActions(e.target.checked)}
                  className="mr-2"
                />
                Show Actions
              </label>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description:</label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showDescription}
                  onChange={(e) => setShowDescription(e.target.checked)}
                  className="mr-2"
                />
                Show Description
              </label>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example where you can change the header variant, size, and toggle elements.',
      },
    },
  },
}; 