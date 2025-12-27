import type { Meta, StoryObj } from '@storybook/react';
import { SpotlightCard } from './SpotlightCard';
import { H3, Body } from './Typography';
import { Beaker } from 'lucide-react';

const meta: Meta<typeof SpotlightCard> = {
    title: 'Atoms/SpotlightCard',
    component: SpotlightCard,
    tags: ['autodocs'],
    argTypes: {
        active: {
            control: 'boolean',
        },
    },
};

export default meta;
type Story = StoryObj<typeof SpotlightCard>;

export const Default: Story = {
    args: {
        active: false,
        className: 'p-8 max-w-sm',
        children: (
            <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100">
                    <Beaker size={24} />
                </div>
                <H3 className="text-slate-900 leading-tight">Spotlight Interaction</H3>
                <Body className="text-slate-600">
                    Move your mouse over this card to see the dynamic radial spotlight effect.
                </Body>
            </div>
        ),
    },
};

export const Active: Story = {
    args: {
        active: true,
        className: 'p-8 max-w-sm',
        children: (
            <div className="space-y-4">
                <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                    <Beaker size={24} />
                </div>
                <H3 className="text-slate-900 leading-tight">Active State</H3>
                <Body className="text-slate-600">
                    This card represents an active or primary selection with a persistent ring highlight.
                </Body>
            </div>
        ),
    },
};
