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
      :allowCustom="true"
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
import { defineComponent, PropType } from 'vue';
import type { ErrorObject } from 'ajv';

import type { SortColumnType } from '@/lib/steps';

import AutocompleteWidget from './Autocomplete.vue';

export default defineComponent({
  name: 'sort-column-widget',
  components: {
    AutocompleteWidget,
  },
  props: {
    value: {
      type: Object as PropType<SortColumnType>,
      default: () => ({
        column: '',
        order: 'asc',
      }),
    },
    dataPath: {
      type: String as PropType<string | null>,
      default: null,
    },
    errors: {
      type: Array as PropType<ErrorObject[]>,
      default: () => [],
    },
    columnNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  computed: {
    sortColumn: {
      get() {
        return this.value.column;
      },
      set(newValue: string) {
        this.$emit('setSelectedColumns', { column: newValue });
        this.update({
          column: newValue,
          order: this.sortOrder,
        });
      },
    },
    sortOrder: {
      get() {
        return this.value.order;
      },
      set(newValue: string) {
        this.update({
          column: this.sortColumn,
          order: newValue,
        });
      },
    },
  },
  methods: {
    update(newValue: SortColumnType) {
      this.$emit('input', newValue);
    },
  },
});
</script>
<style scoped>
.widget-sort__container {
  padding: 0;
}

.widget-sort__container > legend {
  display: none;
}
</style>
