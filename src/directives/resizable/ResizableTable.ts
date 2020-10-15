/*
 * Create handlers for each table header cols to enable resize
 */

export default class ResizableTable {
  table: HTMLElement;
  cols: HTMLCollection;

  constructor(table: HTMLElement) {
    this.table = table;
    this.cols = this.getCols(table);
    this.setColsStyle();
  }

  // Get ths of current table in DOM
  getCols(table: HTMLElement): HTMLCollection {
    const rows: HTMLCollection = table.getElementsByTagName('tr');
    return rows[0].children;
  }

  // apply default style to cols
  setColsStyle(): void {
    for (const col of this.cols) {
      const colElement = col as HTMLElement;
      // minWidth override maxWidth css property so we use it to expand table and cols without having to touch to table width
      colElement.style.minWidth = `${colElement.offsetWidth}px`;
    }
  }
}
