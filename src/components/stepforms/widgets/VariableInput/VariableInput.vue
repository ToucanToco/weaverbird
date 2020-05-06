<template>
  <div class="widget-input-variable">
    <div v-if="isVariable" class="widget-input-variable__variable-container">
      <div class="widget-input-variable__tag-container">
        <div class="widget-input-variable__tag">
          <span class="widget-input-variable__variable-icon">x</span>
          <span class="widget-input-variable__variable-name">{{ variableLabel }}</span>
          <i class="widget-input-variable__tag-close fa fa-times" @click="dismissVariable" />
        </div>
      </div>
    </div>

    <div v-else class="widget-input-variable__input-container">
      <slot />
      <span
        v-if="canBeVariable"
        class="widget-input-variable__variable-toggle"
        :class="{ 'widget-input-variable__variable-toggle--choosing': isChoosingVariable }"
        @click="startChoosingVariable"
        >x
      </span>
    </div>

    <popover
      class="widget-input-variable__variable-chooser"
      :visible="isChoosingVariable"
      :align="alignLeft"
      bottom
      @closed="stopChoosingVariable"
    >
      <div class="widget-input-variable__options-container">
        <div
          class="widget-input-variable__options-section"
          v-for="category in variablesByCategory"
          :key="category.label"
        >
          <div class="widget-input-variable__option-section-title" v-if="category.label">
            {{ category.label }}
          </div>
          <div
            class="widget-input-variable__option"
            v-for="availableVariable in category.variables"
            :key="availableVariable.identifier"
            @click="chooseVariable(availableVariable.identifier)"
          >
            <span class="widget-input-variable__option-name">{{ availableVariable.label }}</span>
            <span class="widget-input-variable__option-value">{{ availableVariable.value }}</span>
          </div>
        </div>
        <!-- <div class="widget-input-variable__advanced-variable">Advanced variable</div> -->
      </div>
    </popover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import Popover from '@/components/Popover.vue';

import extractVariableIdentifier, { VariableDelimiters } from './extract-variable-identifier';

interface AvailableVariable {
  identifier: string; // how the variable will be written in the code
  value: any; // current value of the variable
  category?: string;
  label: string;
}

export type VariablesBucket = AvailableVariable[];

interface VariablesCategory {
  label: string | undefined;
  variables: AvailableVariable[];
}

/**
 * This component wraps an input of any type and allow replacing its value by a variable chosen from a list or an
 * expression.
 */
@Component({
  name: 'variable-input',
  components: {
    Popover,
  },
})
export default class VariableInput extends Vue {
  @Prop()
  value!: any;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  /**
   * Group variables by category to easily choose among them
   *
   * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_groupby
   */
  get variablesByCategory(): VariablesCategory[] {
    return this.availableVariables.reduce(function(categories: VariablesCategory[], variable) {
      const varCategoryLabel = variable.category;
      const category = categories.find(c => c.label === varCategoryLabel);
      if (category !== undefined) {
        category.variables.push(variable);
      } else {
        categories.push({
          label: varCategoryLabel,
          variables: [variable],
        });
      }
      return categories;
    }, []);
  }

  @Prop({ default: () => ({ start: '{{', end: '}}' }) })
  variableDelimiters!: VariableDelimiters;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  search = '';

  isChoosingVariable = false;

  /**
   * Determine whether to authorize or not the selection of a variable
   */
  get canBeVariable() {
    return this.availableVariables && this.availableVariables.length > 0;
  }

  startChoosingVariable() {
    this.isChoosingVariable = true;
  }

  stopChoosingVariable() {
    this.isChoosingVariable = false;
  }

  /**
   * Wraps the chosen variable with delimiters and emits it
   */
  chooseVariable(variableIdentifier: string) {
    this.$emit(
      'input',
      `${this.variableDelimiters.start} ${variableIdentifier} ${this.variableDelimiters.end}`,
    );
    this.stopChoosingVariable();
  }

  get variableIdentifier() {
    return extractVariableIdentifier(this.value, this.variableDelimiters);
  }

  get isVariable() {
    return this.variableIdentifier != null;
  }

  /**
   * If the variable identifier is listed in the available variables, we prefer to display its label.
   */
  get variableLabel() {
    const matchingAvailableVariable = this.availableVariables.find(
      aV => aV.identifier === this.variableIdentifier,
    );
    if (matchingAvailableVariable) {
      return matchingAvailableVariable.label;
    } else {
      return this.variableIdentifier;
    }
  }

  /**
   * Remove any previously chosen variable
   */
  dismissVariable() {
    this.$emit('input', undefined);
  }
}
</script>
<style lang="scss">
@import '../../../../styles/variables';
.widget-input-variable {
  position: relative;
  width: 100%;
}

.widget-input-variable__input-container {
  position: relative;
  width: 100%;
}

.widget-input-variable__variable-toggle {
  font-family: cursive;
  opacity: 0;
  visibility: hidden;
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
  &.widget-input-variable__variable-toggle--choosing {
    opacity: 1;
    visibility: visible;
    background: $active-color;
    color: #eaeff5;
  }
}

// Variable toggle appears when focusing or hovering the input
.widget-input-variable__input-container {
  &:focus-within,
  &:hover {
    .widget-input-variable__variable-toggle {
      visibility: visible;
      opacity: 1;
    }
  }
}

.widget-input-variable__search,
.widget-input-variable__tag-container {
  @extend %form-widget__field;
  &:focus {
    @extend %form-widget__field--focused;
  }
}

.widget-input-variable__options-container {
  display: flex;
  border-radius: 2px;
  width: 180px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
  overflow: hidden;
  flex-direction: column;
}

.widget-input-variable__options-section {
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 10px;
}

.widget-input-variable__option-section-title {
  font-style: italic;
  color: #888888;
  font-size: 10px;
  font-weight: 500;
}

.widget-input-variable__option-section-title,
.widget-input-variable__option,
.widget-input-variable__advanced-variable {
  padding: 12px;
}

.widget-input-variable__option {
  &:hover {
    background-color: rgba(42, 102, 161, 0.05);
    color: #2a66a1;
    .widget-input-variable__options-value {
      color: #2a66a1;
    }
  }
  display: flex;
  justify-content: space-between;
  cursor: pointer;
}

.widget-input-variable__option-name {
  font-size: 12px;
  font-weight: 500;
}

.widget-input-variable__advanced-variable {
  font-size: 12px;
  font-weight: 500;
  &:hover {
    background-color: rgba(42, 102, 161, 0.05);
    color: #2a66a1;
  }
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 5px;
}

.widget-input-variable__option-value {
  font-size: 10px;
  font-weight: 500;
  color: #888888;
  flex-shrink: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  margin-left: 1em;
}

.widget-input-variable__tag {
  border-radius: 4px;
  background-color: rgba(42, 102, 161, 0.05);
  padding: 0 10px;
  color: #2a66a1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-input-variable__variable-icon {
  font-family: cursive;
  margin-right: 1em;
}

.widget-input-variable__tag-close {
  cursor: pointer;
}

.widget-input-variable__variable-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
