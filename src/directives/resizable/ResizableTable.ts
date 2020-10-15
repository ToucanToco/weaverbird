/*
 * Create handlers for each table header cols to enable resize
 */

export default class ResizableTable {
  table: HTMLElement;

  constructor(table: HTMLElement) {
    this.table = table;
  }
}
