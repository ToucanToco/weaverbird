/*
 * Create a col handler which will be add to a col to enable resize
 */

export default class ResizableColHandler {
  handler: HTMLElement;

  constructor() {
    this.handler = this.create();
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
    handler.style.height = `10px`;
    // this default class is used for tests now be will be replaced with custom one in futures commit
    handler.classList.add('table__handler');
    return handler;
  }

  // return the created handler to parent
  render(): HTMLElement {
    return this.handler;
  }
}
