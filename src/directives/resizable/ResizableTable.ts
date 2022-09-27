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
  maxHandleableColumns: 100,
  firstDisplayCharsPerCol: 7.5,
  maxCharsPerCol: 20,
  labelTargetClass: '',
};

export interface ResizableTableOptions {
  classes: {
    table: string; // class applied to table
    handler: string; // class applied to col handler
  };
  columns: string[] | number[]; // the columns associated to cols handlers
  maxHandleableColumns: number; // the number of columns directive can handle without being disabled
  firstDisplayCharsPerCol: number; // The number of chars per col display on first render
  maxCharsPerCol: number; // The max number of chars to display per col
  labelTargetClass: string; // DOM class to select label in col
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
    if (!isEqual(this.options.columns, options.columns)) {
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

  // Add some more px to display chars if some are cropped
  /* istanbul ignore next */ adaptWidthToContent(colElement: HTMLElement, index: number): number {
    const contentChars = this.options.columns[index].toString().length;
    if (!this.options.labelTargetClass || contentChars <= this.options.firstDisplayCharsPerCol)
      return colElement.offsetWidth;

    // Retrieve the label DOM element
    const labelElement = colElement.getElementsByClassName(
      this.options.labelTargetClass,
    )[0] as HTMLElement;
    if (!labelElement) return colElement.offsetWidth;
    // Find the padding width in total col width
    const padding = colElement.offsetWidth - labelElement.offsetWidth;
    // Find the pixel width for a char based on label width and actual chars per col
    const pixelPerChar = labelElement.offsetWidth / this.options.firstDisplayCharsPerCol;
    // Calculate needed width for col based on chars in content
    const contentWidth = pixelPerChar * contentChars;
    // Calculate max available width for col based on max chars per col
    const maxWidth = pixelPerChar * this.options.maxCharsPerCol;
    return padding + Math.ceil(Math.min(contentWidth, maxWidth));
  }

  // apply default style and add handler to each DOM col
  setColHandlers(): void {
    this.destroy(); // remove all previous handlers before adding new ones
    let index = 0;
    for (const col of this.cols) {
      const colElement = col as HTMLElement;
      // Retrieve the adapted width depending on content length (in characters)
      const colWidth = this.adaptWidthToContent(colElement, index);
      // there is sometimes an issue with small table that is solved by adding width to col (otherwise min-width is not set correctly)
      colElement.style.width = `${colWidth}px`;
      // minWidth override maxWidth css property so we use it to expand table and cols without having to touch to table width
      colElement.style.minWidth = `${colWidth}px`;

      const colHandlerOptions: ResizableColHandlerOptions = {
        height: this.table.offsetHeight,
        minWidth: colWidth,
        className: this.options.classes.handler,
      };
      const colHandler: ResizableColHandler = new ResizableColHandler(colHandlerOptions);
      // add the handler to referent DOM col
      col.appendChild(colHandler.render());
      this.colHandlers.push(colHandler);
      index++;
    }
  }

  addTableClass(): void {
    this.table.classList.add(this.options.classes.table);
  }
}
