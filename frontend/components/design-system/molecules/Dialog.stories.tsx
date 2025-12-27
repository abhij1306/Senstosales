import type { Meta, StoryObj } from '@storybook/react';
import { Dialog } from './Dialog';
import { Button } from '../atoms/Button';
import { Body } from '../atoms/Typography';
import React, { useState } from 'react';

const meta: Meta<typeof Dialog> = {
    title: 'Molecules/Dialog',
    component: Dialog,
    tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Interactive: Story = {
    render: (args) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <div className="p-20 flex justify-center">
                <Button onClick={() => setIsOpen(true)}>Open Modal Dialog</Button>
                <Dialog
                    {...args}
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title="Electronic Signature Required"
                    footer={
                        <>
                            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button variant="default" onClick={() => setIsOpen(false)}>Acknowledge & Sign</Button>
                        </>
                    }
                >
                    <div className="space-y-4">
                        <Body className="text-slate-600">
                            By proceeding, you are electronically signing this delivery challan. This action is irreversible and will be logged in the audit trail.
                        </Body>
                        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50">
                            <Body className="text-blue-700 text-xs">
                                IP: 192.168.1.45 | Timestamp: {new Date().toLocaleString()}
                            </Body>
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    },
};
