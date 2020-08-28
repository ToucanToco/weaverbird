<template>
  <div
    class="widget-variable__tag"
    :class="{ 'widget-variable__tag--advanced': isAdvancedVariable }"
    v-tooltip="{
      targetClasses: 'has-weaverbird__tooltip',
      classes: 'weaverbird__tooltip',
      content: variableValue,
      placement: 'bottom-center',
    }"
  >
    <span class="widget-variable__tag-icon">{}</span>
    <span
      class="widget-variable__tag-name"
      @keypress.enter.prevent="editAdvancedVariable"
      @mousedown.prevent="editAdvancedVariable"
      >{{ variableLabel }}</span
    >
    <i
      class="widget-variable__tag-close fa fa-times"
      tabindex="1"
      @keypress.enter.prevent="removeVariableTag"
      @mousedown.prevent="removeVariableTag"
    />
  </div>
</template>

<script lang="ts">
import VTooltip from 'v-tooltip';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { extractVariableIdentifier, VariableDelimiters, VariablesBucket } from '@/lib/variables';

Vue.use(VTooltip);

/**
 * This component display a variable based on a human readable format and allow to delete it
 */
@Component({
  name: 'variable-input',
})
export default class VariableInput extends Vue {
  @Prop()
  value!: string;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({ start: '{{', end: '}}' }) })
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: () => false })
  isAdvanced!: boolean;

  /**
   * Retrieve identifier by removing delimiters from value.
   */
  get variableIdentifier() {
    return extractVariableIdentifier(this.value, this.variableDelimiters);
  }

  /**
   * Retrieve variable in available variables by identifier.
   */
  get variable() {
    return this.availableVariables.find(aV => aV.identifier === this.variableIdentifier);
  }

  /*
  TO_FIX: every variable not found in availableVariables is an advanced variable
  */
  get isAdvancedVariable() {
    return !this.variable && this.isAdvanced;
  }

  /**
   * Display label rather than identifier if available.
   */
  get variableLabel() {
    if (this.isAdvancedVariable) {
      return 'AdVariable';
    } else if (this.variable) {
      return this.variable.label;
    } else {
      // TO_FIX: case never handle due to advanced variable
      return this.variableIdentifier;
    }
  }

  /**
   * Display as list if value is an array.
   */
  get variableValue() {
    const value = this.variable?.value || '';
    return Array.isArray(value) ? value.join(', ') : value;
  }

  removeVariableTag() {
    this.$emit('removed');
  }

  editAdvancedVariable() {
    if (this.isAdvancedVariable) {
      this.$emit('edited', this.value);
    }
  }
}
</script>

<style lang="scss">
@import '../../../../styles/utils/v-tooltip.scss';
</style>

<style scoped lang="scss">
.widget-variable__tag {
  border-radius: 4px;
  background-color: rgba(42, 102, 161, 0.05);
  padding: 0 10px;
  color: #2a66a1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-variable__tag-close {
  cursor: pointer;
}

.widget-variable__tag-icon {
  margin-right: 1em;
}

.widget-variable__tag-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.widget-variable__tag--advanced {
  .widget-variable__tag-name {
    cursor: pointer;
    text-decoration: underline;
  }
}
</style>
