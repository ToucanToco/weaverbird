/*
 * Create handlers for each table header cols to enable resize
 */

export default class ResizableTable {
  table: HTMLElement;
  cols: HTMLCollection;

  constructor(table: HTMLElement) {
    this.table = table;
    this.cols = this.getCols(table);
  }

  // Get ths of current table in DOM
  getCols(table: HTMLElement): HTMLCollection {
    const rows: HTMLCollection = table.getElementsByTagName('tr');
    return rows[0].children;
  }
}
