import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';
import { H3, Body } from './Typography';

const meta: Meta<typeof Card> = {
    title: 'Atoms/Card',
    component: Card,
    tags: ['autodocs'],
    argTypes: {
        glass: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Glass: Story = {
    args: {
        glass: true,
        className: 'p-6 max-w-sm',
        children: (
            <div className="space-y-4">
                <H3 className="text-slate-900">Glassmorphism Card</H3>
                <Body className="text-slate-600">
                    This is a professional glassmorphism card with backdrop blur and a subtle border.
                </Body>
            </div>
        ),
    },
};

export const Flat: Story = {
    args: {
        glass: false,
        className: 'p-6 max-w-sm',
        children: (
            <div className="space-y-4">
                <H3 className="text-slate-900">Standard Card</H3>
                <Body className="text-slate-600">
                    This is a standard flat card with a solid background and slate border.
                </Body>
            </div>
        ),
    },
};

export const Interactive: Story = {
    args: {
        glass: true,
        className: 'p-6 max-w-sm hover:shadow-lg hover:bg-white/55 cursor-pointer',
        children: (
            <div className="space-y-4">
                <H3 className="text-slate-900">Interactive Card</H3>
                <Body className="text-slate-600">
                    Hover over me to see the transition effect.
                </Body>
            </div>
        ),
    },
};
