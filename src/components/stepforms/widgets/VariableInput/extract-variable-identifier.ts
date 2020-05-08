export interface VariableDelimiters {
  start: string;
  end: string;
}

/**
 * Determine if value is variable surrounded by delimiters or not, and if yes, extract its identifier.
 */
export default function extractVariableIdentifier(
  value: any,
  variableDelimiters: VariableDelimiters,
): string | undefined {
  if (typeof value !== 'string') {
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
