export interface VariableDelimiters {
  start: string;
  end: string;
}

/**
 * Escape all characters used in a string for use in a regular expression pattern.
 *
 * From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Escaping
 */
function escapeRegExp(string: string) {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
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

  const regexPattern = `${escapeRegExp(
    variableDelimiters.start,
  )}\\s*([\\\\.\\w]+)\\s*${escapeRegExp(variableDelimiters.end)}`;
  const regex = new RegExp(regexPattern);
  const matches = regex.exec(value);
  if (matches) {
    return matches[1];
  } else {
    return undefined;
  }
}
