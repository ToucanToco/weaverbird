<template>
  <fieldset class="widget-aggregation__container">
    <legend>Aggregate columns</legend>
    <MultiselectWidget
      class="columnsInput"
      :options="columnNames"
      v-model="aggregationColumns"
      name="Columns:"
      placeholder="Select columns"
      :data-path="`${dataPath}.columns`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <AutocompleteWidget
      class="aggregationFunctionInput"
      v-model="aggregationFunction"
      name="Function:"
      :options="aggregationFunctions"
      placeholder="Aggregation function"
      :data-path="`${dataPath}.aggfunction`"
      :errors="errors"
    />
  </fieldset>
</template>
<script lang="ts">
import type { ErrorObject } from 'ajv';
import { defineComponent, PropType } from 'vue';

import type { Aggregation } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import AutocompleteWidget from './Autocomplete.vue';
import MultiselectWidget from './Multiselect.vue';

export default defineComponent({
  name: 'aggregation-widget',
  components: {
    AutocompleteWidget,
    MultiselectWidget,
  },
  props: {
    dataPath: {
      type: String,
      default: null,
    },
    value: {
      type: Object as PropType<Aggregation>,
      default: () => ({ columns: [], aggfunctions: 'sum', newcolumns: [] }),
    },
    errors: {
      type: Array as PropType<ErrorObject[]>,
      default: () => [],
    },
    availableVariables: {
      type: Object as PropType<VariablesBucket | undefined>,
      default: undefined,
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters | undefined>,
      default: undefined,
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters | undefined>,
      default: undefined,
    },
    columnNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  data() {
    return {
      aggregationFunctions: [
        'sum',
        'avg',
        'count',
        'count distinct',
        'min',
        'max',
        'first',
        'last',
      ] as Aggregation['aggfunction'][],
    };
  },
  computed: {
    aggregationColumns: {
      get() {
        return this.value.columns;
      },
      set(newAggregationColumns) {
        this.$emit('input', { ...this.value, columns: newAggregationColumns });
      },
    },
    aggregationFunction: {
      get() {
        return this.value.aggfunction;
      },
      set(newAggregationFunction) {
        this.$emit('input', {
          ...this.value,
          aggfunction: newAggregationFunction,
        });
      },
    },
  },
});
</script>
<style lang="scss" scoped>
@import '../../../styles/_variables';
.widget-aggregation__container {
  @extend %form-widget__container;
  margin-bottom: 0;
  padding: 0;
}

.widget-autocomplete__container {
  align-items: center;
  flex-direction: row;
  margin-bottom: 8px;
}

.widget-multiselect__container {
  align-items: center;
  flex-direction: row;
}
.widget-aggregation__container > legend {
  display: none;
}
</style>
