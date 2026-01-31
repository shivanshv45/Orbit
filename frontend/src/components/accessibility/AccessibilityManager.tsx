/**
 * Accessibility Manager
 * Wraps the app with accessibility mode context for Ctrl+Space toggle
 */

import React from 'react';
import { AccessibilityModeProvider } from '@/context/AccessibilityModeContext';

interface AccessibilityManagerProps {
    children: React.ReactNode;
}

export const AccessibilityManager: React.FC<AccessibilityManagerProps> = ({ children }) => {
    return (
        <AccessibilityModeProvider>
            <div className="contents" id="accessibility-root">
                {children}
            </div>
        </AccessibilityModeProvider>
    );
};
