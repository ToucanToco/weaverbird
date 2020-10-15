/*
 * Create handlers for each table header cols to enable resize
 */

import ResizableColHandler, { ResizableColHandlerOptions } from './ResizableColHandler';

export default class ResizableTable {
  table: HTMLElement;
  cols: HTMLCollection;

  constructor(table: HTMLElement) {
    this.table = table;
    this.cols = this.getCols(table);
    this.setColHandlers();
  }

  // Get ths of current table in DOM
  getCols(table: HTMLElement): HTMLCollection {
    const rows: HTMLCollection = table.getElementsByTagName('tr');
    return rows[0].children;
  }

  // apply default style and add handler to each DOM col
  setColHandlers(): void {
    for (const col of this.cols) {
      const colElement = col as HTMLElement;
      // minWidth override maxWidth css property so we use it to expand table and cols without having to touch to table width
      colElement.style.minWidth = `${colElement.offsetWidth}px`;

      const colHandlerOptions: ResizableColHandlerOptions = {
        height: this.table.offsetHeight,
        minWidth: colElement.offsetWidth,
      };
      const colHandler: HTMLElement = new ResizableColHandler(colHandlerOptions).render();
      // add the handler to referent DOM col
      col.appendChild(colHandler);
    }
  }
}
