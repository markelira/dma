import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
A flexible card component with multiple variants and sub-components.

## Features
- **Multiple variants**: category, university, feature, floating
- **Flexible content**: Header, content, and footer sections
- **Responsive design**: Adapts to different screen sizes
- **Customizable styling**: Color variants and custom classes

## Usage
\`\`\`tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Card content goes here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['feature', 'category', 'university', 'floating'],
      description: 'The visual style variant of the card',
    },
    color: {
      control: { type: 'text' },
      description: 'Color for category variant (e.g., "#10B981")',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card stories
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This is the main content of the card.</p>
      </CardContent>
      <CardFooter>
        <Button>Action</Button>
      </CardFooter>
    </Card>
  ),
};

export const Feature: Story = {
  render: () => (
    <Card variant="feature" className="w-[350px]">
      <CardHeader>
        <CardTitle>Feature Card</CardTitle>
        <CardDescription>Showcasing a feature or capability</CardDescription>
      </CardHeader>
      <CardContent>
        <p>This card highlights important features or information.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">Learn More</Button>
        <Button>Get Started</Button>
      </CardFooter>
    </Card>
  ),
};

export const Category: Story = {
  render: () => (
    <Card variant="category" color="#10B981" className="w-[200px] h-[200px]">
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-xl font-bold mb-2">Technology</h3>
        <p className="text-sm opacity-90">Learn the latest tech skills</p>
      </div>
    </Card>
  ),
};

export const University: Story = {
  render: () => (
    <Card variant="university" className="w-[350px]">
      <CardHeader>
        <CardTitle>University Partnership</CardTitle>
        <CardDescription>Collaborating with top institutions</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Partner with leading universities to provide high-quality education.</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline">View Partners</Button>
      </CardFooter>
    </Card>
  ),
};

export const Floating: Story = {
  render: () => (
            <div className="bg-gradient-to-br from-primary to-purple-600 p-8 rounded-lg">
      <Card variant="floating" className="w-[350px]">
        <CardHeader>
          <CardTitle className="text-gray-900">Floating Card</CardTitle>
          <CardDescription className="text-gray-700">
            Glassmorphic effect with backdrop blur
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-800">
            This card has a glassmorphic effect with backdrop blur and transparency.
          </p>
        </CardContent>
        <CardFooter>
          <Button variant="apple">Continue</Button>
        </CardFooter>
      </Card>
    </div>
  ),
};

// Content-only cards
export const ContentOnly: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardContent className="pt-6">
        <p>This card only has content, no header or footer.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Useful for simple content display.
        </p>
      </CardContent>
    </Card>
  ),
};

export const HeaderOnly: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Header Only</CardTitle>
        <CardDescription>This card only has a header section</CardDescription>
      </CardHeader>
    </Card>
  ),
};

// Multiple cards example
export const CardGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Course 1</CardTitle>
          <CardDescription>Introduction to React</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Learn the fundamentals of React development.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Enroll</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Course 2</CardTitle>
          <CardDescription>Advanced TypeScript</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Master TypeScript for better code quality.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Enroll</Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Course 3</CardTitle>
          <CardDescription>UI/UX Design</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Create beautiful and functional user interfaces.</p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Enroll</Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [isLiked, setIsLiked] = React.useState(false);
    
    return (
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Interactive Card</CardTitle>
          <CardDescription>Click the button to see it in action</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This card demonstrates interactive elements.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Current state: {isLiked ? 'Liked' : 'Not liked'}
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant={isLiked ? "default" : "outline"}
            onClick={() => setIsLiked(!isLiked)}
          >
            {isLiked ? '❤️ Liked' : '🤍 Like'}
          </Button>
          <Button variant="ghost">Share</Button>
        </CardFooter>
      </Card>
    );
  },
}; 