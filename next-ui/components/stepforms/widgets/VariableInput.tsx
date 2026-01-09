// Placeholder for VariableInput.
// For now, it will just render the children (input) directly, effectively disabling variable input functionality
// until we migrate the complex VariableInput machinery (VariableInputBase, VariableTag, etc.)

import React from 'react';

interface VariableInputProps {
    value?: any;
    availableVariables?: any;
    variableDelimiters?: any;
    trustedVariableDelimiters?: any;
    hasArrow?: boolean;
    onChange?: (val: any) => void;
    children: React.ReactNode;
}

export default function VariableInput({ children }: VariableInputProps) {
    return <>{children}</>;
}
