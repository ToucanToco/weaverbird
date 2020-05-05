<template>
  <div class="widget-input-variable">
    <div v-if="isVariable" class="widget-input-variable__variable-container">
      <div class="widget-input-variable__tag-container">
        <div class="widget-input-variable__tag">
          <span>
            <span style="font-family: cursive">x</span>
            &nbsp;
            <span class="widget-input-variable__variable-name">{{ variableName }}</span>
          </span>
          <i class="widget-input-variable__tag-close fa fa-times" @click="dismissVariable" />
        </div>
      </div>
    </div>

    <div v-else class="widget-input-variable__input-container">
      <slot />
      <span
        v-if="canBeVariable"
        class="widget-input-variable__variable-toggle"
        @click="startChoosingVariable"
        >x</span
      >
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
          v-for="variablesBucket in availableVariables"
          :key="variablesBucket.name"
        >
          <div class="widget-input-variable__option-section-title">
            {{ variablesBucket.name }}
          </div>
          <div
            class="widget-input-variable__option"
            v-for="availableVariable in variablesBucket.variables"
            :key="availableVariable.name"
            @click="chooseVariable(availableVariable.name)"
          >
            <span class="widget-input-variable__option-name">{{ availableVariable.name }}</span>
            <span class="widget-input-variable__option-value">{{ availableVariable.value }}</span>
          </div>
        </div>
        <div class="widget-input-variable__advanced-variable">Advanced variable</div>
      </div>
    </popover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import Popover from '@/components/Popover.vue';

import extractVariableName, { VariableDelimiters } from './extract-variable-name';

interface AvailableVariable {
  name: string;
  value: any;
}

export interface VariablesBucket {
  name: string;
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
  availableVariables!: VariablesBucket[];

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
  chooseVariable(variableName: string) {
    this.$emit(
      'input',
      `${this.variableDelimiters.start} ${variableName} ${this.variableDelimiters.end}`,
    );
    this.stopChoosingVariable();
  }

  get variableName() {
    return extractVariableName(this.value, this.variableDelimiters);
  }

  get isVariable() {
    return this.variableName != null;
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
  color: rgb(38, 101, 163);
  border-radius: 50%;
  line-height: 16px;
  font-size: 14px;
  text-align: center;
  transition: 250ms all ease-in;
  cursor: pointer;

  &:hover {
    background: rgb(38, 101, 163);
    color: #eaeff5;
  }
}

// Variable toggle appears when hovering the input
.widget-input-variable__input-container:hover .widget-input-variable__variable-toggle {
  visibility: visible;
  opacity: 1;
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
}

.widget-input-variable__tag {
  border-radius: 4px;
  background-color: rgba(42, 102, 161, 0.05);
  padding: 5px 10px;
  color: #2a66a1;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .widget-input-variable__tag-close {
    cursor: pointer;
  }
}
</style>
