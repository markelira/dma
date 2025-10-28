import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from '../components/ui/form-field';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { Label } from '../components/ui/label';

const meta: Meta<typeof FormField> = {
  title: 'UI/FormField',
  component: FormField,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A flexible form field wrapper component for consistent form styling and layout.

## Features
- **Multiple layouts**: vertical and horizontal
- **Flexible sizing**: Small, medium, large
- **Error handling**: Built-in error display
- **Required indicators**: Automatic required field marking
- **Accessibility**: Proper label associations and ARIA attributes

## Usage
\`\`\`tsx
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';

<FormField
  label="Email Address"
  description="We'll never share your email with anyone else."
  error="Please enter a valid email address."
  required
>
  <Input type="email" placeholder="Enter your email" />
</FormField>
\`\`\`
        `,
      },
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'The field label',
    },
    description: {
      control: { type: 'text' },
      description: 'Optional field description',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message to display',
    },
    required: {
      control: { type: 'boolean' },
      description: 'Whether the field is required',
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the field is disabled',
    },
    layout: {
      control: { type: 'select' },
      options: ['vertical', 'horizontal'],
      description: 'The layout direction of the field',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the field',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Basic form field stories
export const Default: Story = {
  render: () => (
    <FormField label="Email Address">
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      description="We'll never share your email with anyone else."
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      error="Please enter a valid email address."
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

export const Required: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      required
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

export const Disabled: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      disabled
    >
      <Input type="email" placeholder="Enter your email" disabled />
    </FormField>
  ),
};

// Layout variants
export const Horizontal: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      description="We'll never share your email with anyone else."
      layout="horizontal"
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

export const HorizontalWithError: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      error="Please enter a valid email address."
      layout="horizontal"
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

// Size variants
export const Small: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      size="sm"
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

export const Large: Story = {
  render: () => (
    <FormField 
      label="Email Address" 
      size="lg"
    >
      <Input type="email" placeholder="Enter your email" />
    </FormField>
  ),
};

// Different input types
export const TextInput: Story = {
  render: () => (
    <FormField 
      label="Full Name" 
      description="Enter your first and last name"
    >
      <Input placeholder="John Doe" />
    </FormField>
  ),
};

export const TextareaExample: Story = {
  render: () => (
    <FormField 
      label="Bio" 
      description="Tell us a little about yourself"
    >
      <Textarea placeholder="Write your bio here..." />
    </FormField>
  ),
};

export const SelectField: Story = {
  render: () => (
    <FormField 
      label="Country" 
      description="Select your country of residence"
    >
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Select a country" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="us">United States</SelectItem>
          <SelectItem value="ca">Canada</SelectItem>
          <SelectItem value="uk">United Kingdom</SelectItem>
          <SelectItem value="au">Australia</SelectItem>
        </SelectContent>
      </Select>
    </FormField>
  ),
};

export const CheckboxField: Story = {
  render: () => (
    <FormField 
      label="Terms and Conditions" 
      description="I agree to the terms and conditions"
    >
      <div className="flex items-center space-x-2">
        <Checkbox id="terms" />
        <Label htmlFor="terms">I agree to the terms and conditions</Label>
      </div>
    </FormField>
  ),
};

// Form examples
export const ContactForm: Story = {
  render: () => (
    <div className="space-y-6 max-w-md">
      <FormField 
        label="Full Name" 
        required
      >
        <Input placeholder="Enter your full name" />
      </FormField>
      
      <FormField 
        label="Email Address" 
        description="We'll never share your email with anyone else."
        required
      >
        <Input type="email" placeholder="Enter your email" />
      </FormField>
      
      <FormField 
        label="Subject" 
        required
      >
        <Input placeholder="What is this about?" />
      </FormField>
      
      <FormField 
        label="Message" 
        description="Please provide details about your inquiry"
        required
      >
        <Textarea placeholder="Write your message here..." rows={4} />
      </FormField>
      
      <FormField 
        label="Newsletter" 
        description="Subscribe to our newsletter for updates"
      >
        <div className="flex items-center space-x-2">
          <Checkbox id="newsletter" />
          <Label htmlFor="newsletter">Subscribe to newsletter</Label>
        </div>
      </FormField>
    </div>
  ),
};

export const ProfileForm: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField 
          label="First Name" 
          required
        >
          <Input placeholder="Enter your first name" />
        </FormField>
        
        <FormField 
          label="Last Name" 
          required
        >
          <Input placeholder="Enter your last name" />
        </FormField>
      </div>
      
      <FormField 
        label="Email Address" 
        description="This will be used for login and notifications"
        required
      >
        <Input type="email" placeholder="Enter your email" />
      </FormField>
      
      <FormField 
        label="Phone Number" 
        description="Optional - for account recovery"
      >
        <Input type="tel" placeholder="Enter your phone number" />
      </FormField>
      
      <FormField 
        label="Country" 
        required
      >
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select your country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="ca">Canada</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="au">Australia</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
            <SelectItem value="fr">France</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      
      <FormField 
        label="Bio" 
        description="Tell us about yourself (optional)"
      >
        <Textarea placeholder="Write a short bio..." rows={3} />
      </FormField>
    </div>
  ),
};

export const HorizontalForm: Story = {
  render: () => (
    <div className="space-y-6 max-w-4xl">
      <FormField 
        label="Company Name" 
        description="Your company or organization name"
        layout="horizontal"
        required
      >
        <Input placeholder="Enter company name" />
      </FormField>
      
      <FormField 
        label="Industry" 
        description="What industry does your company operate in?"
        layout="horizontal"
        required
      >
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="tech">Technology</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
            <SelectItem value="finance">Finance</SelectItem>
            <SelectItem value="education">Education</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      
      <FormField 
        label="Company Size" 
        description="Number of employees"
        layout="horizontal"
      >
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select company size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1-10">1-10 employees</SelectItem>
            <SelectItem value="11-50">11-50 employees</SelectItem>
            <SelectItem value="51-200">51-200 employees</SelectItem>
            <SelectItem value="201-1000">201-1000 employees</SelectItem>
            <SelectItem value="1000+">1000+ employees</SelectItem>
          </SelectContent>
        </Select>
      </FormField>
      
      <FormField 
        label="Description" 
        description="Brief description of your company"
        layout="horizontal"
      >
        <Textarea placeholder="Describe your company..." rows={3} />
      </FormField>
    </div>
  ),
};

// Interactive example
export const Interactive: Story = {
  render: () => {
    const [label, setLabel] = React.useState('Email Address');
    const [description, setDescription] = React.useState('We\'ll never share your email with anyone else.');
    const [error, setError] = React.useState('');
    const [required, setRequired] = React.useState(false);
    const [disabled, setDisabled] = React.useState(false);
    const [layout, setLayout] = React.useState<'vertical' | 'horizontal'>('vertical');
    const [size, setSize] = React.useState<'sm' | 'md' | 'lg'>('md');
    
    return (
      <div className="space-y-6">
        <FormField 
          label={label}
          description={description}
          error={error}
          required={required}
          disabled={disabled}
          layout={layout}
          size={size}
        >
          <Input type="email" placeholder="Enter your email" disabled={disabled} />
        </FormField>
        
        <div className="space-y-4 p-4 border rounded-lg">
          <h3 className="font-semibold">Controls</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Label:</label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Field label"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Description:</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Field description"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Error:</label>
              <Input
                value={error}
                onChange={(e) => setError(e.target.value)}
                placeholder="Error message"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Layout:</label>
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as any)}
                className="w-full p-2 border rounded"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
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
            
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(e) => setRequired(e.target.checked)}
                  className="mr-2"
                />
                Required
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={disabled}
                  onChange={(e) => setDisabled(e.target.checked)}
                  className="mr-2"
                />
                Disabled
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
        story: 'Interactive example where you can change all the form field properties.',
      },
    },
  },
}; 