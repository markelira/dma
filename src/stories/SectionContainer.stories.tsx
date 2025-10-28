import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { SectionContainer } from '../components/ui/section-container';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const meta: Meta<typeof SectionContainer> = {
  title: 'UI/SectionContainer',
  component: SectionContainer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
A flexible section container component for consistent spacing and layout.

## Features
- **Multiple variants**: default, narrow, wide, full
- **Flexible spacing**: None, small, medium, large, extra large
- **Background options**: Default, muted, primary, secondary
- **Responsive design**: Adapts to different screen sizes
- **Semantic structure**: Proper section elements

## Usage
\`\`\`tsx
import { SectionContainer } from '@/components/ui/section-container';

<SectionContainer spacing="lg" background="muted">
  <h2>Section Title</h2>
  <p>Section content goes here.</p>
</SectionContainer>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'narrow', 'wide', 'full'],
      description: 'The width variant of the container',
    },
    spacing: {
      control: { type: 'select' },
      options: ['none', 'sm', 'md', 'lg', 'xl'],
      description: 'The vertical spacing of the section',
    },
    background: {
      control: { type: 'select' },
      options: ['default', 'muted', 'primary', 'secondary'],
      description: 'The background color of the section',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic section container stories
export const Default: Story = {
  render: () => (
    <SectionContainer>
      <h2 className="text-2xl font-bold mb-4">Default Section</h2>
      <p className="text-muted-foreground">
        This is a default section with standard spacing and background.
      </p>
    </SectionContainer>
  ),
};

export const Narrow: Story = {
  render: () => (
    <SectionContainer variant="narrow">
      <h2 className="text-2xl font-bold mb-4">Narrow Section</h2>
      <p className="text-muted-foreground">
        This section has a narrower maximum width, perfect for focused content.
      </p>
    </SectionContainer>
  ),
};

export const Wide: Story = {
  render: () => (
    <SectionContainer variant="wide">
      <h2 className="text-2xl font-bold mb-4">Wide Section</h2>
      <p className="text-muted-foreground">
        This section uses the full available width for expansive content.
      </p>
    </SectionContainer>
  ),
};

export const Full: Story = {
  render: () => (
    <SectionContainer variant="full">
      <h2 className="text-2xl font-bold mb-4">Full Width Section</h2>
      <p className="text-muted-foreground">
        This section spans the entire viewport width with minimal padding.
      </p>
    </SectionContainer>
  ),
};

// Spacing variants
export const SmallSpacing: Story = {
  render: () => (
    <SectionContainer spacing="sm">
      <h2 className="text-2xl font-bold mb-4">Small Spacing</h2>
      <p className="text-muted-foreground">
        This section has minimal vertical spacing.
      </p>
    </SectionContainer>
  ),
};

export const LargeSpacing: Story = {
  render: () => (
    <SectionContainer spacing="lg">
      <h2 className="text-2xl font-bold mb-4">Large Spacing</h2>
      <p className="text-muted-foreground">
        This section has generous vertical spacing for breathing room.
      </p>
    </SectionContainer>
  ),
};

export const ExtraLargeSpacing: Story = {
  render: () => (
    <SectionContainer spacing="xl">
      <h2 className="text-2xl font-bold mb-4">Extra Large Spacing</h2>
      <p className="text-muted-foreground">
        This section has maximum vertical spacing for prominent sections.
      </p>
    </SectionContainer>
  ),
};

// Background variants
export const MutedBackground: Story = {
  render: () => (
    <SectionContainer background="muted">
      <h2 className="text-2xl font-bold mb-4">Muted Background</h2>
      <p className="text-muted-foreground">
        This section has a subtle background color to create visual separation.
      </p>
    </SectionContainer>
  ),
};

export const PrimaryBackground: Story = {
  render: () => (
    <SectionContainer background="primary">
      <h2 className="text-2xl font-bold mb-4 text-primary-foreground">Primary Background</h2>
      <p className="text-primary-foreground/80">
        This section uses the primary brand color for emphasis.
      </p>
    </SectionContainer>
  ),
};

export const SecondaryBackground: Story = {
  render: () => (
    <SectionContainer background="secondary">
      <h2 className="text-2xl font-bold mb-4 text-secondary-foreground">Secondary Background</h2>
      <p className="text-secondary-foreground/80">
        This section uses the secondary color for subtle emphasis.
      </p>
    </SectionContainer>
  ),
};

// Content examples
export const CardGrid: Story = {
  render: () => (
    <SectionContainer spacing="lg">
      <h2 className="text-3xl font-bold mb-8 text-center">Featured Courses</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>React Fundamentals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Learn the basics of React development with hands-on projects.
            </p>
            <Button className="mt-4">Learn More</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>TypeScript Mastery</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Master TypeScript for better code quality and developer experience.
            </p>
            <Button className="mt-4">Learn More</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>UI/UX Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Create beautiful and functional user interfaces.
            </p>
            <Button className="mt-4">Learn More</Button>
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  ),
};

export const HeroSection: Story = {
  render: () => (
    <SectionContainer spacing="xl" background="primary">
      <div className="text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-6">
          Learn Without Limits
        </h1>
        <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
          Start, switch, or advance your career with thousands of courses from world-class universities and companies.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" variant="secondary">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
            Learn More
          </Button>
        </div>
      </div>
    </SectionContainer>
  ),
};

export const Testimonials: Story = {
  render: () => (
    <SectionContainer spacing="lg" background="muted">
      <h2 className="text-3xl font-bold mb-8 text-center">What Our Students Say</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "The courses on DMA helped me transition into a new career. The quality is outstanding!"
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-full mr-3"></div>
              <div>
                <p className="font-semibold">Sarah Johnson</p>
                <p className="text-sm text-muted-foreground">Software Engineer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "I love how practical and hands-on the learning experience is. Highly recommended!"
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-full mr-3"></div>
              <div>
                <p className="font-semibold">Mike Chen</p>
                <p className="text-sm text-muted-foreground">Product Manager</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              "The instructors are experts in their fields and the community is incredibly supportive."
            </p>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-primary rounded-full mr-3"></div>
              <div>
                <p className="font-semibold">Emily Rodriguez</p>
                <p className="text-sm text-muted-foreground">UX Designer</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionContainer>
  ),
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [variant, setVariant] = React.useState<'default' | 'narrow' | 'wide' | 'full'>('default');
    const [spacing, setSpacing] = React.useState<'none' | 'sm' | 'md' | 'lg' | 'xl'>('md');
    const [background, setBackground] = React.useState<'default' | 'muted' | 'primary' | 'secondary'>('default');
    
    return (
      <div className="space-y-6">
        <SectionContainer
          variant={variant}
          spacing={spacing}
          background={background}
        >
          <h2 className="text-2xl font-bold mb-4">Interactive Section</h2>
          <p className="text-muted-foreground">
            This section demonstrates all the available options. Use the controls below to customize it.
          </p>
        </SectionContainer>
        
        <div className="container mx-auto px-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Variant:</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="default">Default</option>
                <option value="narrow">Narrow</option>
                <option value="wide">Wide</option>
                <option value="full">Full</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Spacing:</label>
              <select
                value={spacing}
                onChange={(e) => setSpacing(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Background:</label>
              <select
                value={background}
                onChange={(e) => setBackground(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="default">Default</option>
                <option value="muted">Muted</option>
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example where you can change the section variant, spacing, and background.',
      },
    },
  },
}; 