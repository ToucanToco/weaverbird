/*
 * ResizableDirective allow to resize columns width of a table
 * ResizableDirective add handlers to all cell of first row of the selected table enabling events
 * Table will be resize automatically to fit container or expand if cols width are wider than available width
 */

import { DirectiveOptions } from 'vue';

import ResizableTable from './ResizableTable';

const directive: DirectiveOptions = {
  inserted(el: HTMLElement) {
    // directive should only work with a table
    if (el.nodeName != 'TABLE') return;
    // instantiate resizable table
    new ResizableTable(el);
  },
};

export default directive;
