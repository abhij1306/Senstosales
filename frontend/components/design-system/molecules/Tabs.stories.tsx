import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs';
import { Card } from '../atoms/Card';
import { Body } from '../atoms/Typography';
import React from 'react';

const meta: Meta<typeof Tabs> = {
    title: 'Molecules/Tabs',
    component: Tabs,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="overview" className="w-[600px]">
            <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Line Items</TabsTrigger>
                <TabsTrigger value="history">Journey</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <Card className="p-6 mt-4">
                    <Body>Summary view of the document showing key performance indicators and header details.</Body>
                </Card>
            </TabsContent>
            <TabsContent value="details">
                <Card className="p-6 mt-4">
                    <Body>Detailed list of all items, quantities, and reconciliation status.</Body>
                </Card>
            </TabsContent>
            <TabsContent value="history">
                <Card className="p-6 mt-4">
                    <Body>Audit trail and movement history of this document through the supply chain.</Body>
                </Card>
            </TabsContent>
        </Tabs>
    ),
};
