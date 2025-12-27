import type { Meta, StoryObj } from '@storybook/react';
import { H1, H2, H3, Body, Label, SmallText, TableText, Accounting, MonoCode } from './Typography';
import React from 'react';

const meta: Meta = {
    title: 'Atoms/Typography',
    tags: ['autodocs'],
};

export default meta;

export const HeadingScale: StoryObj = {
    render: () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>H1 Heading (28px)</Label>
                <H1>The Quick Brown Fox</H1>
            </div>
            <div className="space-y-2">
                <Label>H2 Subheading (20px)</Label>
                <H2>The Quick Brown Fox Jumps Over</H2>
            </div>
            <div className="space-y-2">
                <Label>H3 Section Header (16px)</Label>
                <H3>The Quick Brown Fox Jumps Over the Lazy Dog</H3>
            </div>
        </div>
    ),
};

export const BodyAndLabels: StoryObj = {
    render: () => (
        <div className="space-y-6 max-w-md">
            <div className="space-y-2">
                <Label>Label Text (10px, Semibold)</Label>
                <Body>
                    Body Text (13px, Medium). This is the standard reading size for business intelligence dashboards and data grids. It ensures high information density while maintaining legibility.
                </Body>
            </div>
            <div className="space-y-2">
                <Label>Small Text (11px)</Label>
                <SmallText>
                    Used for secondary information, metadata, or timestamps that don't require primary focus.
                </SmallText>
            </div>
            <div className="space-y-2">
                <Label>Table Text (12px)</Label>
                <TableText>
                    Used specifically inside data cells to maximize vertical density in large registers.
                </TableText>
            </div>
        </div>
    ),
};

export const NumericAndCode: StoryObj = {
    render: () => (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label>Accounting (Currency)</Label>
                <Accounting isCurrency>{1250000.50}</Accounting>
            </div>
            <div className="space-y-2">
                <Label>Accounting (Short Currency)</Label>
                <Accounting isCurrency short>{1250000.50}</Accounting>
            </div>
            <div className="space-y-2">
                <Label>Accounting (Numeric)</Label>
                <Accounting>{98542.25}</Accounting>
            </div>
            <div className="space-y-2">
                <Label>Mono / Code</Label>
                <div className="flex gap-2">
                    <MonoCode>DC-2024-001</MonoCode>
                    <MonoCode>INV-9854-SEC</MonoCode>
                </div>
            </div>
        </div>
    ),
};
