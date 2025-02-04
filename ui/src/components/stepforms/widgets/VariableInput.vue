<template>
  <div class="widget-input-variable">
    <div v-if="isVariable" class="widget-input-variable__variable-container">
      <div class="widget-input-variable__tag-container">
        <VariableTag
          :value="value"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
          :trusted-variable-delimiters="trustedVariableDelimiters"
          @removed="dismissVariable"
          @edited="editAdvancedVariable"
        />
      </div>
    </div>
    <VariableInputBase
      :isVariable="isVariable"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :has-arrow="hasArrow"
      :edited-advanced-variable="editedAdvancedVariable"
      @chooseAdvancedVariable="chooseVariable"
      @resetEditedAdvancedVariable="resetEditedAdvancedVariable"
      @input="chooseVariable"
    >
      <slot v-if="!isVariable" />
    </VariableInputBase>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';
import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';
import { extractVariableIdentifier } from '@/lib/variables';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
/**
 * This component wraps an input of any type and allow replacing its value by a variable chosen from a list or an
 * expression.
 */
export default defineComponent({
  name: 'variable-input',
  components: {
    VariableTag,
    VariableInputBase,
  },
  props: {
    value: {
      required: true,
    },
    availableVariables: {
      type: Object as PropType<VariablesBucket | undefined>,
      default: undefined,
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    hasArrow: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      editedAdvancedVariable: '',
    };
  },
  computed: {
    isVariable() {
      const identifier = extractVariableIdentifier(
        this.value,
        this.variableDelimiters,
        this.trustedVariableDelimiters,
      );
      return identifier != null;
    },
  },
  methods: {
    chooseVariable(value: string) {
      this.$emit('input', value);
    },
    dismissVariable() {
      this.$emit('input', undefined);
    },
    editAdvancedVariable(value: string) {
      this.editedAdvancedVariable = value;
    },
    resetEditedAdvancedVariable() {
      this.editedAdvancedVariable = '';
    },
  },
});
</script>

<style scoped lang="scss">
@import '../../../styles/variables';
.widget-input-variable {
  position: relative;
  width: 100%;
}

.widget-input-variable__tag-container {
  @extend %form-widget__field;
  &:focus {
    @extend %form-widget__field--focused;
  }
}
</style>
