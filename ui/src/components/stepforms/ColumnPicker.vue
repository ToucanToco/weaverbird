<template>
  <AutocompleteWidget
    :value="value"
    :name="name"
    :options="columnNames"
    @input="valueChanged"
    :placeholder="placeholder"
    :data-path="dataPath"
    :errors="errors"
    :available-variables="availableVariables"
    :variable-delimiters="variableDelimiters"
    :trusted-variable-delimiters="trustedVariableDelimiters"
    :allowCustom="true"
  />
</template>

<script lang="ts">
import type { ErrorObject } from 'ajv';
import { defineComponent, PropType } from 'vue';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

export default defineComponent({
  name: 'column-picker',
  
  components: { 
    AutocompleteWidget 
  },
  
  props: {
    name: {
      type: String,
      default: 'column'
    },
    placeholder: {
      type: String,
      default: 'Enter a column'
    },
    errors: {
      type: Array as PropType<ErrorObject[]>,
      default: () => []
    },
    dataPath: {
      type: String,
      default: null
    },
    value: {
      type: String,
      default: null
    },
    availableVariables: {
      type: Array as PropType<VariablesBucket>,
      default: undefined
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined
    },
    // Whether the column data of ColumnPicker should react to a change of
    // selected column
    syncWithSelectedColumn: {
      type: Boolean,
      default: true
    },
    selectedColumns: {
      type: Array as PropType<string[]>,
      default: () => []
    },
    columnNames: {
      type: Array as PropType<string[]>,
      default: () => []
    }
  },
  
  created() {
    if (this.syncWithSelectedColumn && this.selectedColumns[0] && !this.value) {
      this.$emit('input', this.selectedColumns[0]);
    }
  },
  
  watch: {
    selectedColumns: {
      handler() {
        if (
          this.syncWithSelectedColumn &&
          this.selectedColumns[0] &&
          this.selectedColumns[0] !== this.value
        ) {
          this.$emit('input', this.selectedColumns[0]);
        }
      }
    }
  },
  
  methods: {
    valueChanged(newColumn: string) {
      this.$emit('input', newColumn);
      if (this.syncWithSelectedColumn) {
        this.$emit('setSelectedColumns', { column: newColumn });
      }
    }
  }
});
</script>
