<template>
  <div class="widget-multi-variable-input">
    <VariableInputBase
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :has-arrow="hasArrow"
      :is-multiple="true"
      :value="value"
      :edited-advanced-variable="editedAdvancedVariable"
      @chooseAdvancedVariable="chooseAdvancedVariable"
      @resetEditedAdvancedVariable="resetEditedAdvancedVariable"
      @input="chooseVariable"
    >
      <slot />
    </VariableInputBase>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

/**
 * This component wraps an input (multiselect) and toggle variables in value array
 */
export default defineComponent({
  name: 'multi-variable-input',
  components: { VariableInputBase },
  props: {
    value: {
      type: Array as PropType<any[]>,
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
    editedAdvancedVariable: {
      type: String as PropType<string>,
      default: '',
    },
    hasArrow: {
      type: Boolean as PropType<boolean>,
      default: false,
    },
  },
  methods: {
    /**
     * Toggle value in array
     */
    chooseVariable(value: string[]) {
      this.$emit('input', value);
    },
    /**
     * Add advanced variable to value or edit it if editAdvancedVariable value is provided
     */
    chooseAdvancedVariable(value: string) {
      // remove potential duplicated value
      const values = [...this.value].filter((v) => v !== value);

      const index = values.indexOf(this.editedAdvancedVariable);
      if (index !== -1) {
        values.splice(index, 1, value);
        this.$emit('input', values);
      } else {
        this.$emit('input', [...values, value]);
      }
    },
    /*
    Reset the advanced variable to edit
    */
    resetEditedAdvancedVariable() {
      this.$emit('resetEditedAdvancedVariable');
    },
  },
});
</script>

<style scoped lang="scss">
.widget-multi-variable-input {
  position: relative;
  width: 100%;
}
</style>
