<template>
  <div>
    <div class="widget-variable__input-container">
      <slot />
      <div
        class="widget-variable__click-handler"
        v-if="isChoosingVariable"
        @click="stopChoosingVariable"
      />
      <span
        v-if="canBeVariable"
        class="widget-variable__toggle"
        :class="{
          'widget-variable__toggle--choosing': isChoosingVariable,
          'widget-variable__toggle--hidden': isVariable,
          'widget-variable__toggle--parent-arrow': hasArrow,
        }"
        @click.stop="startChoosingVariable"
        >{}
      </span>
    </div>

    <VariableChooser
      :available-variables="availableVariables"
      :is-opened="isChoosingVariable"
      :is-multiple="isMultiple"
      :value="value"
      :selected-variables="selectedVariables"
      @addAdvancedVariable="openAdvancedVariableModal"
      @input="chooseVariable"
      @closed="stopChoosingVariable"
    />
    <AdvancedVariableModal
      :is-opened="isAdvancedVariableModalOpened"
      :variable="editedAdvancedVariable"
      :variable-delimiters="variableDelimiters"
      @input="chooseAdvancedVariable"
      @closed="closeAdvancedVariableModal"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import { extractVariableIdentifier, isTrustedVariable } from '@/lib/variables';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import AdvancedVariableModal from './AdvancedVariableModal.vue';
import VariableChooser from './VariableChooser.vue';
import { sendAnalytics } from '@/lib/send-analytics';

/**
 * This component wraps an input of any type and allow modifing its value by one or multiple variables chosen from a list or an
 * expression.
 */
@Component({
  name: 'variable-input-base',
  components: {
    VariableChooser,
    AdvancedVariableModal,
  },
})
export default class VariableInputBase extends Vue {
  @Prop({ default: false })
  isMultiple!: boolean;

  @Prop({ default: () => '' })
  value!: string | string[];

  @Prop({ default: undefined })
  availableVariables!: VariablesBucket;

  @Prop({ default: () => ({ start: '{{', end: '}}' }) })
  variableDelimiters!: VariableDelimiters;

  @Prop({ default: undefined })
  trustedVariableDelimiters!: VariableDelimiters;

  @Prop({ default: () => '' })
  editedAdvancedVariable!: string;

  @Prop({ default: false })
  hasArrow!: boolean;

  @Prop({ default: false })
  isVariable!: boolean;

  isChoosingVariable = false;

  isAdvancedVariableModalOpened = false;

  @Watch('editedAdvancedVariable')
  editAdvancedVariable() {
    if (this.editedAdvancedVariable) this.openAdvancedVariableModal();
  }

  /**
   * Remove identifier from selected variable(s)
   */
  get selectedVariables(): string | string[] {
    if (!Array.isArray(this.value)) {
      return (
        extractVariableIdentifier(
          this.value,
          this.variableDelimiters,
          this.trustedVariableDelimiters,
        ) ?? ''
      );
    } else {
      return this.value.reduce((variables: string[], value: string) => {
        const identifier = extractVariableIdentifier(
          value,
          this.variableDelimiters,
          this.trustedVariableDelimiters,
        );
        // in case value is a simple string we still want to keep it in array
        return [...variables, identifier || value];
      }, []);
    }
  }

  /**
   * Determine whether to authorize or not the selection of a variable
   */
  get canBeVariable() {
    return this.availableVariables;
  }

  startChoosingVariable() {
    this.isChoosingVariable = true;
    sendAnalytics({ name: 'Variables button clicked' });
  }

  stopChoosingVariable() {
    this.isChoosingVariable = false;
  }

  openAdvancedVariableModal() {
    this.stopChoosingVariable();
    this.isAdvancedVariableModalOpened = true;
  }

  closeAdvancedVariableModal() {
    this.isAdvancedVariableModalOpened = false;
    this.$emit('resetEditedAdvancedVariable');
  }

  setVariableDelimiters(value: string | string[]): string | string[] {
    const retrieveVariableDelimiters = (
      variableIdentifier: string,
    ): VariableDelimiters | undefined => {
      const variable = this.availableVariables.find((v) => v.identifier === variableIdentifier);
      if (!variable) {
        return; // if variable is unfound we don't want to display any delimiters
      } else if (isTrustedVariable(variable)) {
        return this.trustedVariableDelimiters;
      }
      return this.variableDelimiters;
    };
    const addVariableDelimiters = (variableIdentifier: string): string => {
      const delimiters = retrieveVariableDelimiters(variableIdentifier);
      if (!delimiters) return variableIdentifier;
      return `${delimiters.start} ${variableIdentifier} ${delimiters.end}`;
    };
    return Array.isArray(value)
      ? value.map((v) => addVariableDelimiters(v))
      : addVariableDelimiters(value);
  }

  /**
   * Emit the choosen variable(s)
   */
  chooseVariable(selectedVariables: string | string[]) {
    const value = this.setVariableDelimiters(selectedVariables);
    this.$emit('input', value);
    if (!this.isMultiple) {
      this.stopChoosingVariable(); // keep list open with multiVariable mode
    }
  }

  /**
   * Emit the choosen advanced variable and close the modal
   */
  chooseAdvancedVariable(variableIdentifier: string) {
    const value = `${this.variableDelimiters.start} ${variableIdentifier} ${this.variableDelimiters.end}`;
    this.$emit('chooseAdvancedVariable', value);
    this.closeAdvancedVariableModal();
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-variable__input-container {
  position: relative;
  width: 100%;
  // Variable toggle appears when focusing or hovering the input
  &:focus-within,
  &:hover {
    .widget-variable__toggle {
      visibility: visible;
      opacity: 1;
    }
  }
}

.widget-variable__click-handler {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
}

.widget-variable__toggle {
  display: block;
  position: absolute;
  top: 0;
  bottom: 0;
  margin: auto;
  right: 10px;
  width: 18px;
  height: 18px;
  background: #eaeff5;
  color: $active-color;
  border-radius: 50%;
  line-height: 16px;
  font-size: 14px;
  text-align: center;
  transition: 250ms all ease-in;
  cursor: pointer;

  &:hover,
  &.widget-variable__toggle--choosing {
    background: $active-color;
    color: #eaeff5;
  }

  &.widget-variable__toggle--hidden {
    display: none;
  }

  &.widget-variable__toggle--parent-arrow {
    right: 35px;
  }
}
</style>
