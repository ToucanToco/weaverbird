<template>
  <div class="widget-date-input">
    <div class="widget-date-input__container">
      <span class="widget-date-input__label">Last 12 month</span>
      <div class="widget-date-input__button" @click="openEditor">
        <i class="far fa-calendar" aria-hidden="true" />
      </div>
    </div>
    <popover class="widget-date-input__editor" :visible="isEditorOpened" :align="alignLeft" bottom>
      <div class="widget-date-input__editor-container">
        <CustomVariableList
          :availableVariables="availableVariables"
          :selectedVariables="selectedVariables"
          @selectCustomVariable="editCustomVariable"
          @input="selectVariable"
        />
      </div>
    </popover>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import Popover from '@/components/Popover.vue';
import { DateVariable, RelativeDate } from '@/lib/dates';
import {
  AvailableVariable,
  extractVariableIdentifier,
  VariableDelimiters,
  VariablesBucket,
} from '@/lib/variables';

import CustomVariableList from './CustomVariableList.vue';
/**
 * This component allow to select a relative or fixed date using date components
 */
@Component({
  name: 'new-date-input',
  components: {
    CustomVariableList,
    Popover,
  },
})
export default class NewDateInput extends Vue {
  @Prop({ default: '' })
  value!: DateVariable | RelativeDate;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: { start: '', end: '' } })
  variableDelimiters!: VariableDelimiters;

  isEditorOpened = false;
  alignLeft: string = POPOVER_ALIGN.LEFT;

  get variable(): AvailableVariable | undefined {
    if (typeof this.value !== 'string') return undefined;
    const identifier = extractVariableIdentifier(this.value, this.variableDelimiters);
    return this.availableVariables.find(v => v.identifier === identifier);
  }

  get selectedVariables(): string {
    return this.variable?.identifier ?? '';
  }

  openEditor(): void {
    this.isEditorOpened = true;
  }

  closeEditor(): void {
    this.isEditorOpened = false;
  }

  selectVariable(value: string): void {
    const variableWithDelimiters = `${this.variableDelimiters.start}${value}${this.variableDelimiters.end}`;
    this.$emit('input', variableWithDelimiters);
    this.closeEditor();
  }

  editCustomVariable(): void {
    // TODO: do all custom things here
    this.closeEditor();
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';

$grey: #808080;
$grey-light: #d9d9d9;
$grey-extra-light: #f6f6f6;

.widget-date-input {
  max-width: 400px;
  position: relative;
}
.widget-date-input__container {
  border: 1px solid $grey-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.widget-date-input__label {
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
  max-width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}
.widget-date-input__button {
  padding: 10px 15px;
  background: $grey-extra-light;
  color: $grey;
  cursor: pointer;
}

.widget-date-input__container:hover {
  border-color: $active-color;
  .widget-date-input__button {
    background-color: $active-color-faded-2;
    color: $active-color;
  }
}

.widget-date-input__editor {
  margin-left: -5px;
  margin-right: -5px;
  width: 200px;
}
.widget-date-input__editor-container {
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
}
</style>
