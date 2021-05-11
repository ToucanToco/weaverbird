//Parser works like an id, to make sure that data copied/pasted from clipboard is coming from weaverbird
export const CLIPBOARD_PARSER = '<<<Weaverbird>>>';

/**
 * Verify if retrieved data from clipboard is coming from weaverbird based on parser
 * Then remove parser from string
 */
export function parseTextFromClipboard(text: string | undefined, parser: string): string {
  if (!text || !(text.startsWith(parser) && text.endsWith(parser))) {
    return '';
  }
  const regex = new RegExp(parser, 'g');
  const textWithoutParser = text.replace(regex, '');
  return textWithoutParser;
}

/**
 * Add parser to string before sending text to clipboard
 */
export function parseTextForClipboard(text: string, parser: string): string {
  return text ? `${parser}${text}${parser}` : text;
}

/**
 *
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) return;
  // Add parser to string
  const parsedText = parseTextForClipboard(text, CLIPBOARD_PARSER);
  // Send string to clipboard
  await navigator.clipboard.writeText(parsedText);
}

export async function pasteFromClipboard(): Promise<string> {
  if (!navigator.clipboard) return '';
  // Retrieve string from clipboard
  const text: string | undefined = await navigator.clipboard.readText();
  // Remove parser from string
  const unparsedText = parseTextFromClipboard(text, CLIPBOARD_PARSER);
  return unparsedText;
}
