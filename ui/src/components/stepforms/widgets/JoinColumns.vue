<template>
  <div class="widget-join-column__container">
    <AutocompleteWidget
      class="leftOn"
      v-model="leftOnColumn"
      placeholder="Current dataset column"
      :options="columnNames"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <!-- defaults to a simple text input if we don't have any column names -->
    <AutocompleteWidget
      v-if="rightColumnNames"
      class="rightOn"
      data-cy="weaverbird-join-column-right-on"
      v-model="rightOnColumn"
      placeholder="Right dataset column"
      :options="rightColumnNames"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <InputTextWidget
      v-else
      class="rightOn"
      data-cy="weaverbird-join-column-right-on"
      v-model="rightOnColumn"
      placeholder="Right dataset column"
      :data-path="`${dataPath}[1]`"
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

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import InputTextWidget from './InputText.vue';

export default defineComponent({
  name: 'join-colum-widget',
  components: {
    AutocompleteWidget,
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
    columnNames: {
      type: Array as PropType<string[]>,
      default: () => [],
    },
    rightColumnNames: {
      type: Array as PropType<string[] | null>,
      default: null,
    },
  },
  computed: {
    leftOnColumn: {
      get() {
        return this.value[0];
      },
      set(newLeftOnColumn: string) {
        // If no right column, set it to the same as left column (smart default)
        const newRightColumn = this.rightOnColumn === '' ? newLeftOnColumn : this.rightOnColumn;
        this.update([newLeftOnColumn, newRightColumn]);
      },
    },
    rightOnColumn: {
      get() {
        return this.value[1];
      },
      set(newRightOnColumn: string) {
        this.update([this.leftOnColumn, newRightOnColumn]);
      },
    },
  },
  methods: {
    update(newJoinColumns: string[]) {
      this.$emit('input', newJoinColumns);
    },
  },
});
</script>
<style lang="scss" scoped>
.rightOn {
  margin-left: 10px;
}

.widget-join-column__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-join-column__container ::v-deep .widget-autocomplete__container {
  width: 50%;
}

.widget-join-column__container ::v-deep .widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 10px;
  margin-right: 5px;
  width: 50%;
}

.widget-join-column__container ::v-deep .multiselect {
  width: 100%;
  margin-right: 10px;
}
</style>
