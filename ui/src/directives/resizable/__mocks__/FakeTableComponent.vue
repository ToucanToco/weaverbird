<template>
  <table v-resizable="directiveOptions" aria-hidden="true">
    <thead>
      <tr>
        <th v-for="name in columnNames" scope="row" :key="name">{{ name }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i">
        <td v-for="name in columnNames" :key="`${name}_${i}`">{{ row[name] }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import resizable from '@/directives/resizable/resizable';
import type { ResizableTableOptions } from '@/directives/resizable/ResizableTable';

export default defineComponent({
  name: 'FakeTableComponent',

  directives: {
    resizable,
  },

  props: {
    options: {
      type: Object as PropType<ResizableTableOptions>,
      default: undefined,
    },
    rows: {
      type: Array as PropType<Array<{ [name: string]: string }>>,
      default: () => [{ Col1: '1', Col2: '2', Col3: '3' }],
    },
  },

  computed: {
    columnNames(): string[] {
      return this.rows ? Object.keys(this.rows[0]) : [];
    },
    directiveOptions(): any {
      return { columns: this.columnNames, ...this.options };
    },
  },
});
</script>
