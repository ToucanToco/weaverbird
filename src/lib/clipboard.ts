//Flag works like an id, to make sure that data copied/pasted from clipboard is coming from weaverbird
export const CLIPBOARD_FLAG = '<<<Weaverbird>>>';

/**
 * Verify if retrieved data from clipboard is coming from weaverbird based on flag
 * Then remove flag from string
 */
export function validateAndRemoveTextFlag(text: string | undefined, flag: string): string {
  if (!text || !(text.startsWith(flag) && text.endsWith(flag))) return '';
  const regex = new RegExp(flag, 'g');
  return text.replace(regex, '');
}

/**
 * Add flag to string before sending text to clipboard
 */
export function addTextFlag(text: string, flag: string): string {
  return text ? `${flag}${text}${flag}` : text;
}

/**
 * Copy selected text to clipboard
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) return;
  // Add flag to string
  const textWithValidator = addTextFlag(text, CLIPBOARD_FLAG);
  // Send string to clipboard
  await navigator.clipboard.writeText(textWithValidator);
}

/**
 * Retrieve text from clipboard, return an empty string if flag is not in string
 */
export async function pasteFromClipboard(): Promise<string> {
  if (!navigator.clipboard) return '';
  // Retrieve string from clipboard
  const textFromClipboard: string | undefined = await navigator.clipboard.readText();
  // Remove flag from string
  return validateAndRemoveTextFlag(textFromClipboard, CLIPBOARD_FLAG);
}
