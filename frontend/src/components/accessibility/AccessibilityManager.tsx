import React from 'react';
import { AccessibilityModeProvider } from '@/context/AccessibilityModeContext';
import { AccessibilityModeIndicator } from './AccessibilityModeIndicator';

interface AccessibilityManagerProps {
    children: React.ReactNode;
}

export const AccessibilityManager: React.FC<AccessibilityManagerProps> = ({ children }) => {
    return (
        <AccessibilityModeProvider>
            <div className="contents" id="accessibility-root">
                {children}
                <AccessibilityModeIndicator />
            </div>
        </AccessibilityModeProvider>
    );
};
