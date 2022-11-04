<template>
  <div class="widget-multi-variable-input">
    <VariableInputBase
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
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
import { Component, Prop, Vue } from 'vue-property-decorator';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

/**
 * This component wraps an input (multiselect) and toggle variables in value array
 */
@Component({
  name: 'multi-variable-input',
  components: { VariableInputBase },
})
export default class MultiVariableInput extends Vue {
  @Prop({ type: Array, default: () => [] })
  value!: any[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop({ default: () => '' })
  editedAdvancedVariable!: string;

  @Prop({ default: false })
  hasArrow?: boolean; //move variable-chooser button to the left if parent has an expand arrow

  /**
   * Toggle value in array
   */
  chooseVariable(value: string[]) {
    this.$emit('input', value);
  }

  /**
   * Add advanced variable to value or edit it if editAdvancedVariable value is provided
   */
  chooseAdvancedVariable(value: string) {
    // remove potential duplicated value
    const values = [...this.value].filter(v => v !== value);

    const index = values.indexOf(this.editedAdvancedVariable);
    if (index !== -1) {
      values.splice(index, 1, value);
      this.$emit('input', values);
    } else {
      this.$emit('input', [...values, value]);
    }
  }

  /*
  Reset the advanced variable to edit
  */
  resetEditedAdvancedVariable() {
    this.$emit('resetEditedAdvancedVariable');
  }
}
</script>

<style scoped lang="scss">
.widget-multi-variable-input {
  position: relative;
  width: 100%;
}
</style>
