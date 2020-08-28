<template>
  <div class="widget-multi-variable-input">
    <VariableInputBase
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      :has-arrow="hasArrow"
      :is-multiple="true"
      :value="value"
      :selectedAdvancedVariable="selectedAdvancedVariable"
      @input="toggleVariable"
    >
      <slot />
    </VariableInputBase>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

/**
 * This component wraps an input (multiselect) and toggle variables in value array
 */
@Component({
  name: 'multi-variable-input',
})
export default class MultiVariableInput extends Vue {
  @Prop({ type: Array, default: () => [] })
  value!: any[];

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  @Prop()
  advancedVariableDelimiters!: VariableDelimiters;

  @Prop({ default: false })
  hasArrow?: boolean; //move variable-chooser button to the left if parent has an expand arrow

  @Prop({ type: String, default: '' })
  selectedAdvancedVariable!: string;

  // See https://vuejs.org/v2/guide/components.html#Circular-References-Between-Components
  beforeCreate() {
    this.$options.components['VariableInputBase'] = VariableInputBase;
  }

  /**
   * Toggle value in array
   */
  toggleVariable(value: string) {
    if (this.value.indexOf(value) !== -1) {
      this.$emit(
        'input',
        this.value.filter(v => v !== value),
      );
    } else {
      this.$emit('input', [...this.value, value]);
    }
  }
}
</script>

<style scoped lang="scss">
.widget-multi-variable-input {
  position: relative;
  width: 100%;
}
</style>
