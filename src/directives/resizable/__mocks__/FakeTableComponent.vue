<template>
  <table v-resizable="options">
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
import Vue, { PropType } from 'vue';
import { Component, Prop } from 'vue-property-decorator';

import resizable from '@/directives/resizable/resizable';
import { ResizableTableOptions } from '@/directives/resizable/ResizableTable';
@Component({
  name: 'FakeTableComponent',
  directives: {
    resizable,
  },
})
export default class FakeTableComponent extends Vue {
  @Prop({
    type: Object,
    default: undefined,
  })
  options?: PropType<ResizableTableOptions>;

  @Prop({
    type: Array,
    default: () => [{ Col1: '1', Col2: '2', Col3: '3' }],
  })
  rows?: Array<{ [name: string]: string }>;

  get columnNames(): string[] {
    return this.rows ? Object.keys(this.rows[0]) : [];
  }
}
</script>
