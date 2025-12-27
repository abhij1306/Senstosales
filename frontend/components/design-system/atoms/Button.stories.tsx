import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

const meta: Meta<typeof Button> = {
    title: 'Atoms/Button',
    component: Button,
    tags: ['autodocs'],
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'secondary', 'destructive', 'ghost', 'outline', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'sm', 'lg', 'icon'],
        },
        disabled: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
    args: {
        children: 'Primary Button',
        variant: 'default',
    },
};

export const Secondary: Story = {
    args: {
        children: 'Secondary Button',
        variant: 'secondary',
    },
};

export const Destructive: Story = {
    args: {
        children: 'Delete Action',
        variant: 'destructive',
    },
};

export const Outline: Story = {
    args: {
        children: 'Outline Button',
        variant: 'outline',
    },
};

export const Ghost: Story = {
    args: {
        children: 'Ghost Button',
        variant: 'ghost',
    },
};

export const WithIcon: Story = {
    args: {
        variant: 'default',
        children: (
            <>
                <Mail className="mr-2 h-4 w-4" /> Login with Email
            </>
        ),
    },
};

export const IconOnly: Story = {
    args: {
        variant: 'outline',
        size: 'icon',
        children: <ArrowRight className="h-4 w-4" />,
    },
};

export const Loading: Story = {
    args: {
        disabled: true,
        children: (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Please wait
            </>
        ),
    },
};
