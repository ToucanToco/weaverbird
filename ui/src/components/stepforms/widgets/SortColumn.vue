<template>
  <fieldset class="widget-sort__container">
    <legend>Sort column</legend>
    <AutocompleteWidget
      class="columnInput"
      :options="columnNames"
      v-model="sortColumn"
      name="Column"
      placeholder="Enter a column"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
    />
    <AutocompleteWidget
      class="sortOrderInput"
      v-model="sortOrder"
      name="Order"
      :options="['asc', 'desc']"
      placeholder="Order by"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
    />
  </fieldset>
</template>
<script lang="ts">
import type { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import type { SortColumnType } from '@/lib/steps';
import { Action, Getter } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

import AutocompleteWidget from './Autocomplete.vue';

@Component({
  name: 'sort-column-widget',
  components: {
    AutocompleteWidget,
  },
})
export default class SortColumnWidget extends Vue {
  @Prop({
    type: Object,
    default: () => ({
      column: '',
      order: 'asc',
    }),
  })
  value!: SortColumnType;

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Getter(VQBModule) columnNames!: string[];
  @Action(VQBModule) setSelectedColumns!: VQBActions['setSelectedColumns'];

  get sortColumn() {
    return this.value.column;
  }

  set sortColumn(newValue) {
    this.setSelectedColumns({ column: newValue });
    this.update({
      column: newValue,
      order: this.sortOrder,
    });
  }

  get sortOrder() {
    return this.value.order;
  }

  set sortOrder(newValue) {
    this.update({
      column: this.sortColumn,
      order: newValue,
    });
  }

  update(newValue: SortColumnType) {
    this.$emit('input', newValue);
  }
}
</script>
<style scoped>
.widget-sort__container {
  padding: 0;
}

.widget-sort__container > legend {
  display: none;
}
</style>
