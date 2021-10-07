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
      variableIdentifier.length,
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

/*
Retrieve a variable in a list of available variables based on the value with variable delimiters and identifier: ex {{toto}}
*/
export const retrieveVariable = (
  value: string,
  availableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
): AvailableVariable | undefined => {
  // retrieve the variable identifier
  const identifier = extractVariableIdentifier(value, variableDelimiters);
  // search on relative available variables
  return availableVariables.find((v: AvailableVariable) => v.identifier === identifier);
};
