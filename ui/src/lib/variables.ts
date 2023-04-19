/* notify which delimiters should be used (default or trusted ones)
  this way we can use different delimiters for each variable
  [...
  { 
    identifier: 'data.client',
    label: 'Data from client',
    // => if variable is not trusted it will use default delimiters
  },
  {
    identifier: 'data.server',
    label: 'Data from server',
    ...
    trusted: true -> it will use trusted delimiters
  }
  ...]
*/

export interface AvailableVariable {
  identifier: string; // how the variable will be written in the code
  value?: any; // current value of the variable
  category?: string;
  label: string;
  selected?: boolean;
  trusted?: boolean;
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

/* Retrieve the identifier in a string with specific delimiters (trusted/default) */
function extractVariableIdentifierWithDelimiters(
  value: any,
  variableDelimiters?: VariableDelimiters,
) {
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

/**
 * Determine if value is variable surrounded by delimiters or not, and if yes, extract its identifier.
 */
export function extractVariableIdentifier(
  value: any,
  variableDelimiters: VariableDelimiters,
  trustedVariableDelimiters?: VariableDelimiters,
): string | undefined {
  // extract variable from trusted or default delimiters
  return (
    extractVariableIdentifierWithDelimiters(value, trustedVariableDelimiters) ??
    extractVariableIdentifierWithDelimiters(value, variableDelimiters)
  );
}

/*
Retrieve a variable in a list of available variables based on the value with variable delimiters and identifier: ex {{toto}}
*/
export const retrieveVariable = (
  value: string,
  availableVariables: VariablesBucket = [],
  variableDelimiters: VariableDelimiters = { start: '', end: '' },
  trustedVariableDelimiters?: VariableDelimiters,
): AvailableVariable | undefined => {
  // Retrieve the type of variable (trusted or default)
  const trimmedValue = value.trim();
  const isVariable =
    trustedVariableDelimiters &&
    trimmedValue.startsWith(trustedVariableDelimiters.start) &&
    trimmedValue.endsWith(trustedVariableDelimiters.end);
  // retrieve the variable identifier
  const identifier = extractVariableIdentifierWithDelimiters(
    value,
    isVariable ? trustedVariableDelimiters : variableDelimiters,
  );
  // search on relative available variables
  return availableVariables.find(
    (v: AvailableVariable) => v.identifier === identifier,
  );
};

export const isTrustedVariable = (variable?: AvailableVariable): Boolean => {
  return !!variable?.trusted;
}