<template>
  <div class="widget-input-variable">
    <div v-if="isVariable" class="widget-input-variable__variable-container">
      <div class="widget-input-variable__tag-container">
        <VariableTag
          :value="value"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
          @removed="dismissVariable"
          @edited="editAdvancedVariable"
        />
      </div>
    </div>
    <VariableInputBase
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
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
import { Component, Prop, Vue } from 'vue-property-decorator';

import VariableInputBase from '@/components/stepforms/widgets/VariableInputs/VariableInputBase.vue';
import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';
import { extractVariableIdentifier, VariableDelimiters, VariablesBucket } from '@/lib/variables';

/**
 * This component wraps an input of any type and allow replacing its value by a variable chosen from a list or an
 * expression.
 */
@Component({
  name: 'variable-input',
  components: {
    VariableTag,
    VariableInputBase,
  },
})
export default class VariableInput extends Vue {
  editedAdvancedVariable = '';

  @Prop()
  value!: any;

  @Prop()
  availableVariables!: VariablesBucket;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: false })
  hasArrow?: boolean; //move variable-chooser button to the left if parent has an expand arrow

  /**
   * Verify if we need to display the slot or the variableTag
   */
  get isVariable() {
    const identifier = extractVariableIdentifier(this.value, this.variableDelimiters);
    return identifier != null;
  }

  /**
   * Wraps the chosen variable with delimiters and emits it
   */
  chooseVariable(value: string) {
    this.$emit('input', value);
  }

  /**
   * Remove any previously chosen variable
   */
  dismissVariable() {
    this.$emit('input', undefined);
  }

  /*
  Select the advanced variable to edit
  */
  editAdvancedVariable(value: string) {
    this.editedAdvancedVariable = value;
  }

  /*
  Reset the advanced variable to edit
  */
  resetEditedAdvancedVariable() {
    this.editedAdvancedVariable = '';
  }
}
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
