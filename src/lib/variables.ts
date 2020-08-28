export interface AdvancedVariable {
  type: string;
  code: string;
}

export interface AvailableVariable {
  identifier: string; // how the variable will be written in the code
  value: any; // current value of the variable
  category?: string;
  label: string;
  selected?: boolean;
}

export type VariablesBucket = AvailableVariable[];

export interface VariablesCategory {
  label: string | undefined;
  variables: AvailableVariable[];
}

export interface VariableType {
  type: string;
  label: string;
  default?: boolean;
}

export interface VariableDelimiters {
  start: string;
  end: string;
}

/**
 * Determine if value is variable surrounded by delimiters or not, and if yes, extract its identifier.
 */
export function extractVariableIdentifier(
  value: any,
  variableDelimiters: VariableDelimiters,
): string | undefined {
  if (typeof value !== 'string' || !variableDelimiters) {
    return undefined;
  }

  // Removes any leading and trailing spaces
  const trimmedValue = value.trim();

  if (
    trimmedValue.startsWith(variableDelimiters.start) &&
    trimmedValue.endsWith(variableDelimiters.end)
  ) {
    let variableIdentifier = trimmedValue;
    // Removes delimiters
    variableIdentifier = variableIdentifier.slice(
      variableDelimiters.start.length,
      variableIdentifier.length - 1,
    );
    variableIdentifier = variableIdentifier.slice(
      0,
      variableIdentifier.length - variableDelimiters.end.length,
    );
    // Removes any leading and trailing spaces
    variableIdentifier = variableIdentifier.trim();

    return variableIdentifier;
  } else {
    return undefined;
  }
}
