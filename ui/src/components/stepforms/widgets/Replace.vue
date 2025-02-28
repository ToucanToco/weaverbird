<template>
  <div class="widget-to-replace__container">
    <InputTextWidget
      class="valueToReplace"
      v-model="valueToReplace"
      placeholder="Value to replace"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <InputTextWidget
      class="newValue"
      v-model="newValueToReplace"
      placeholder="New value"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
  </div>
</template>
<script lang="ts">
import type { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import { defineComponent, PropType } from 'vue';

import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import InputTextWidget from './InputText.vue';

export default defineComponent({
  name: 'replace-widget',
  components: {
    InputTextWidget,
  },
  props: {
    value: {
      type: Array as PropType<any[]>,
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
  },
  created() {
    if (isEqual(this.value, ['', ''])) {
      this.update(this.value);
    }
  },
  computed: {
    valueToReplace: {
      get() {
        return this.value[0];
      },
      set(newValue) {
        this.update([newValue, this.newValueToReplace]);
      },
    },
    newValueToReplace: {
      get() {
        return this.value[1];
      },
      set(newValue) {
        this.update([this.valueToReplace, newValue]);
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
.widget-to-replace__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
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
