//Validator works like an id, to make sure that data copied/pasted from clipboard is coming from weaverbird
export const CLIPBOARD_VALIDATOR = '<<<Weaverbird>>>';

/**
 * Verify if retrieved data from clipboard is coming from weaverbird based on validator
 * Then remove validator from string
 */
export function validateClipboardText(text: string | undefined, validator: string): string {
  if (!text || !(text.startsWith(validator) && text.endsWith(validator))) return '';
  const regex = new RegExp(validator, 'g');
  return text.replace(regex, '');
}

/**
 * Add validator to string before sending text to clipboard
 */
export function addTextValidator(text: string, validator: string): string {
  return text ? `${validator}${text}${validator}` : text;
}

/**
 * Copy selected text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) return;
  // Add validator to string
  const textWithValidator = addTextValidator(text, CLIPBOARD_VALIDATOR);
  // Send string to clipboard
  await navigator.clipboard.writeText(textWithValidator);
}

/**
 * Retrieve text from clipboard, return an empty string if validator is not in string
 */
export async function pasteFromClipboard(): Promise<string> {
  if (!navigator.clipboard) return '';
  // Retrieve string from clipboard
  const textFromClipboard: string | undefined = await navigator.clipboard.readText();
  // Remove validator from string
  return validateClipboardText(textFromClipboard, CLIPBOARD_VALIDATOR);
}
