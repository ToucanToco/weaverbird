/*
 * Create a col handler which will be add to a col to enable resize
 */

export interface ResizableColHandlerOptions {
  height: number; // the table height to make handler accessible on every td/th
  minWidth: number; // the min width col can handle
}

export default class ResizableColHandler {
  handler: HTMLElement;
  options: ResizableColHandlerOptions;
  col: HTMLElement | undefined; // define if col is selected or not (drag/drop)
  colWidth: number; // keep the wanted col width when dragging the handler
  pageX: number; // apply correct width after dropping the handler

  constructor(options: ResizableColHandlerOptions) {
    this.options = options;
    this.handler = this.create();
    this.colWidth = 0;
    this.pageX = 0;
    this.col = undefined;
    this.setEvents();
  }

  // create a handler DOM element
  create(): HTMLElement {
    const handler = document.createElement('div');
    handler.style.top = '0';
    handler.style.right = '-4px';
    handler.style.width = '7px';
    handler.style.position = 'absolute';
    handler.style.cursor = 'col-resize';
    handler.style.zIndex = '1';
    handler.style.userSelect = 'none';
    // as we want the selector to be accessible on all table height, your header col should not be overflow: hidden
    handler.style.height = `${this.options.height}px`;
    // this default class is used for tests now be will be replaced with custom one in futures commit
    handler.classList.add('table__handler');
    return handler;
  }

  // return the created handler to parent
  render(): HTMLElement {
    return this.handler;
  }

  // assign events to handler
  setEvents(): void {
    this.handler.addEventListener('mousedown', (e: MouseEvent) => this.startDragging(e));
    document.addEventListener('mouseup', () => this.stopDragging());
    document.addEventListener('mousemove', (e: MouseEvent) => this.resize(e));
    this.handler.addEventListener('dblclick', (e: MouseEvent) => this.reset(e));
  }

  // retrieve padding of selected col
  getColPadding(col: HTMLElement): number {
    const paddLeft = window.getComputedStyle(col, null).getPropertyValue('padding-left');
    const paddRight = window.getComputedStyle(col, null).getPropertyValue('padding-right');
    return parseInt(paddLeft) + parseInt(paddRight);
  }

  // keep values of selected col to resize
  startDragging(e: MouseEvent): void {
    const target = e.target as HTMLElement;

    if (target.parentElement) {
      this.pageX = e.pageX;
      this.col = target.parentElement;
      this.colWidth = this.col.offsetWidth - this.getColPadding(this.col);
    }
  }

  // reset values of selected col to resize
  stopDragging(): void {
    this.col = undefined;
    this.colWidth = 0;
    this.pageX = 0;
  }

  // apply new min width to selected col
  resize(e: MouseEvent): void {
    const diffX = e.pageX - this.pageX;
    if (this.col) {
      const newWidth = this.colWidth + diffX;
      // applied width should never go down min width
      const currWidth = newWidth > this.options.minWidth ? newWidth : this.options.minWidth;
      // use minWidth rather than width will extend col and table automatically (no need to resize table width)
      this.col.style.minWidth = `${currWidth}px`;
    }
  }

  // reapply default instantiation width to referent col
  reset(e: Event): void {
    const target = e.target as HTMLElement;
    const currCol: HTMLElement | null = target.parentElement;
    if (currCol) {
      currCol.style.minWidth = `${this.options.minWidth}px`;
    }
  }
}
