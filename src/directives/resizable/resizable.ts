/*
 * ResizableDirective allow to resize columns width of a table
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
