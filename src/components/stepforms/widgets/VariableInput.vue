<template>
  <div class="widget-input-variable">
    <div v-if="isVariable" class="widget-input-variable__variable-container">
      <div class="widget-input-variable__tag-container">
        <VariableTag
          :value="value"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
          :is-advanced="advancedVariableDelimiters"
          @removed="dismissVariable"
          @edited="editAdvancedVariable"
        />
      </div>
    </div>
    <VariableInputBase
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      :has-arrow="hasArrow"
      :selected-advanced-variable="selectedAdvancedVariable"
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
  },
})
export default class VariableInput extends Vue {
  /* Select the advanced variable to edit in advanced variable modal */
  selectedAdvancedVariable = '';

  @Prop()
  value!: any;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  @Prop()
  advancedVariableDelimiters!: VariableDelimiters;

  @Prop({ default: false })
  hasArrow?: boolean; //move variable-chooser button to the left if parent has an expand arrow

  // See https://vuejs.org/v2/guide/components.html#Circular-References-Between-Components
  beforeCreate() {
    this.$options.components['VariableInputBase'] = VariableInputBase;
  }

  /**
   * Verify if we need to display the slot or the variableTag
   */
  get isVariable() {
    const identifier = extractVariableIdentifier(this.value, this.variableDelimiters);
    const advancedVariableIdentifier = extractVariableIdentifier(
      this.value,
      this.advancedVariableDelimiters,
    );
    return identifier != null || advancedVariableIdentifier != null;
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

  /**
   * Select the advanced variable to edit in advanced variable modal when clicking on tag
   */
  editAdvancedVariable() {
    if (this.advancedVariableDelimiters) {
      this.selectedAdvancedVariable = this.value;
    }
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
