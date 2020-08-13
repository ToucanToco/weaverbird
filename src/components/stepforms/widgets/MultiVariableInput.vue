<template>
  <div class="widget-input-variable">
    <VariableInputBase
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :has-arrow="hasArrow"
      :toggable="true"
      :value="value"
      @input="toggleVariable"
    >
      <slot />
    </VariableInputBase>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';
import { setVariableIdentifier, VariableDelimiters, VariablesBucket } from '@/lib/variables';

/**
 * This component wraps an input of any type and allow replacing its value by a variable chosen from a list or an
 * expression.
 */
@Component({
  name: 'multi-variable-input',
  components: { VariableInputBase },
})
export default class MultiVariableInput extends Vue {
  @Prop({ type: Array, default: () => [] })
  value!: any[];

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({ start: '{{', end: '}}' }) })
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: false })
  hasArrow?: boolean; //move variable-chooser button to the left if parent has an expand arrow

  /**
   * Wraps the chosen variable with delimiters and toggle it
   */
  toggleVariable(variableIdentifier: string) {
    const value = setVariableIdentifier(variableIdentifier, this.variableDelimiters);
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
.widget-input-variable {
  position: relative;
  width: 100%;
}
</style>
