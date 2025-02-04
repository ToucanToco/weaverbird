<template>
  <div class="widget-to-cumsum__container">
    <ColumnPicker
      class="columnToCumSum"
      name
      v-model="columnToCumSum"
      placeholder="Enter a column"
      :syncWithSelectedColumn="false"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="$emit('setSelectedColumns', $event)"
    />
    <InputTextWidget
      class="newColumn"
      v-model="newColumnToCumSum"
      :placeholder="`${columnToCumSum}_CUMSUM`"
      :data-path="`${dataPath}[1]`"
      :warning="duplicateColumnName"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';
import type { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import InputTextWidget from './InputText.vue';

export default defineComponent({
  name: 'cumsum-widget',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
  props: {
    value: {
      type: Array as PropType<string[]>,
      default: () => ['', ''],
    },
    dataPath: {
      type: String as PropType<string | null>,
      default: null,
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
    selectedColumns: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    columnNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
  },
  created() {
    if (isEqual(this.value, ['', ''])) {
      this.update(this.value);
    }
  },
  computed: {
    columnToCumSum: {
      get() {
        return this.value[0];
      },
      set(newColumnName: string) {
        this.update([newColumnName, this.newColumnToCumSum]);
      },
    },
    duplicateColumnName() {
      if (this.columnNames.includes(this.newColumnToCumSum)) {
        return `A column name "${this.newColumnToCumSum}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
    newColumnToCumSum: {
      get() {
        return this.value[1];
      },
      set(newColumnName: string) {
        this.update([this.columnToCumSum, newColumnName]);
      },
    },
  },
  methods: {
    update(newValues: string[]) {
      this.$emit('input', newValues);
    },
  },
});
</script>
<style lang="scss" scoped>
.widget-to-cumsum__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-autocomplete__container {
  width: 50%;

  ::v-deep .widget-input-variable {
    width: 90%;
  }
}

.widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 5px;
  margin-right: 5px;
  width: 50%;

  ::v-deep .widget-input-variable {
    width: 90%;
  }
}
</style>
