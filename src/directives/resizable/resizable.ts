/*
 * ResizableDirective allow to resize columns width of a table
 */

import { DirectiveOptions } from 'vue';

const directive: DirectiveOptions = {
  inserted(el: HTMLElement) {
    // directive should only work with a table
    if (el.nodeName != 'TABLE') return;
    // TODO: if it is the case instantiate a ResizableTable class
  },
};

export default directive;
