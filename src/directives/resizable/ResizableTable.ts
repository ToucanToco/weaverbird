/*
 * Create handlers for each table header cols to enable resize
 */

import isEqual from 'lodash/isEqual';

import ResizableColHandler, { ResizableColHandlerOptions } from './ResizableColHandler';

export const DEFAULT_OPTIONS: ResizableTableOptions = {
  classes: {
    table: 'table--resizable',
    handler: 'table__handler',
  },
  columns: [],
};

export interface ResizableTableOptions {
  classes: {
    table: string; // class applied to table
    handler: string; // class applied to col handler
  };
  columns: string[] | number[]; // the columns associated to cols handlers
}

export default class ResizableTable {
  table: HTMLElement;
  cols: HTMLCollection;
  colHandlers: ResizableColHandler[];
  options: ResizableTableOptions;

  constructor(table: HTMLElement, customOptions?: ResizableTableOptions) {
    this.options = { ...DEFAULT_OPTIONS, ...customOptions };
    this.table = table;
    this.colHandlers = [];
    this.cols = this.getCols(table);
    this.setColHandlers();
    this.addTableClass();
  }

  destroy(): void {
    this.colHandlers.forEach((colHandler: ResizableColHandler) => colHandler.destroy());
    this.colHandlers = [];
  }

  // reset cols handlers if cols has been updated
  // resize cols handlers height if rows has been updated
  update(options: ResizableTableOptions): void {
    if (!isEqual(this.options.columns.sort(), options.columns.sort())) {
      this.updateCols(options);
    } else if (this.table.offsetHeight !== this.colHandlers[0].options.height) {
      this.updateRows();
    }
  }

  // Resize handlers height to fit current number of table rows
  updateRows(): void {
    this.colHandlers.forEach((colHandler: ResizableColHandler) =>
      colHandler.update({ ...colHandler.options, height: this.table.offsetHeight }),
    );
  }
  // Reset handlers to fit current table cols
  updateCols(options: ResizableTableOptions): void {
    this.options = { ...this.options, ...options };

    for (const col of this.cols) {
      const colElement = col as HTMLElement;
      // reset col widths
      colElement.style.width = '';
      colElement.style.minWidth = '';
    }

    this.setColHandlers();
  }

  // Get ths of current table in DOM
  getCols(table: HTMLElement): HTMLCollection {
    const rows: HTMLCollection = table.getElementsByTagName('tr');
    return rows[0].children;
  }
  // apply default style and add handler to each DOM col
  setColHandlers(): void {
    this.destroy(); // remove all previous handlers before adding new ones
    for (const col of this.cols) {
      const colElement = col as HTMLElement;
      // there is sometimes an issue with small table that is solved by adding width to col (otherwise min-width is not set correctly)
      colElement.style.width = `${colElement.offsetWidth}px`;
      // minWidth override maxWidth css property so we use it to expand table and cols without having to touch to table width
      colElement.style.minWidth = `${colElement.offsetWidth}px`;

      const colHandlerOptions: ResizableColHandlerOptions = {
        height: this.table.offsetHeight,
        minWidth: colElement.offsetWidth,
        className: this.options.classes.handler,
      };
      const colHandler: ResizableColHandler = new ResizableColHandler(colHandlerOptions);
      // add the handler to referent DOM col
      col.appendChild(colHandler.render());
      this.colHandlers.push(colHandler);
    }
  }

  addTableClass(): void {
    this.table.classList.add(this.options.classes.table);
  }
}
