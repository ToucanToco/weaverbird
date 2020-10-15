/*
 * ResizableDirective allow to resize columns width of a table
 *
 * ResizableDirective add handlers to all cell of first row of the selected table enabling events
 * Table will be resize automatically to fit container or expand if cols width are wider than available width
 *
 * Default options can be overrided after directive name (check ResizableTableOptions interface):
 *
 * For props updated components, columns is required
 * columns: string[] | number[]
 * Used to check if col handlers needs to be updated
 *
 * ex: `v-resizable="{
 *     columns: ["a", "b", "c"],
 *     classes: {
 *       table: 'data-viewer-table--resizable',
 *       handler: 'data-viewer-table__handler',
 *      },
 *   }"`
 */

import { DirectiveOptions } from 'vue';
import { DirectiveBinding } from 'vue/types/options';

import ResizableTable, { ResizableTableOptions } from './ResizableTable';

// stock table to destroy referent listeners when component is destroyed
export let resizableTable: ResizableTable | null;

export const resizable: DirectiveOptions = {
  inserted(el: HTMLElement, node: DirectiveBinding) {
    // directive should only work with a table
    if (el.nodeName != 'TABLE') return;
    // instantiate resizable table
    const options: ResizableTableOptions = node.value;
    resizableTable = new ResizableTable(el, options);
  },
  async componentUpdated(_, node: DirectiveBinding) {
    const options: ResizableTableOptions = node.value;
    /* istanbul ignore next */
    setTimeout(() => resizableTable?.update(options), 1); // we need to wait 1 frame for the table to get it's new height
  },
  unbind() {
    // removeListener for selected table to avoid memory leaks
    if (resizableTable) {
      resizableTable.destroy();
      resizableTable = null;
    }
  },
};

export default resizable;
