<template>
  <div class="widget-list__container" :class="toggleClassErrorWarning">
    <label v-if="name">{{ name }}</label>
    <div class="widget-list__body">
      <div class="widget-list__child" v-for="(child, index) in children" :key="index">
        <span class="widget-list__component-sep" v-if="index > 0 && separatorLabel">{{
          separatorLabel
        }}</span>
        <div class="widget-list__component">
          <component
            :is="widget"
            v-bind="componentProps"
            :value="child.value"
            :available-variables="availableVariables"
            :variable-delimiters="variableDelimiters"
            @input="updateChildValue($event, index)"
            :data-path="`${dataPath}[${index}]`"
            :errors="errors"
          />
        </div>
        <div class="widget-list__icon" v-if="child.isRemovable" @click="removeChild(index)">
          <i class="far fa-trash-alt" aria-hidden="true" />
        </div>
      </div>
      <div v-if="messageError" class="field__msg-error">
        <span class="fa fa-exclamation-circle" />
        {{ messageError }}
      </div>
      <button v-if="!automaticNewField" class="widget-list__add-fieldset" @click="addFieldSet">
        <i class="fas fa-plus-circle" aria-hidden="true" />
        {{ addFieldName }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import _ from 'lodash';
import { VueConstructor } from 'vue';
import { Component, Mixins, Prop, Vue } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { TotalDimension } from '@/lib/steps.ts';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import FormWidget from './FormWidget.vue';

type Field = {
  name: string;
  label?: string;
  value: any;
};

type RepeatableField = Field[];

@Component({
  name: 'list-widget',
})
export default class ListWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  addFieldName!: string;

  @Prop({ type: Object, default: () => {} })
  componentProps!: object;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: null })
  separatorLabel!: string;

  @Prop({ type: Array, default: () => [] })
  value!: any[];

  @Prop({
    type: Function,
    default: InputTextWidget,
  })
  widget!: VueConstructor<Vue>;

  @Prop({ type: Boolean, default: true })
  automaticNewField!: boolean;

  @Prop({ default: null })
  defaultItem!: string | RepeatableField | TotalDimension;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ default: null })
  dataPath!: string;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  get children() {
    const valueCopy = [...this.value];
    if (this.automaticNewField) {
      valueCopy.push(this.defaultChildValue);
    }
    return valueCopy.map(value => ({
      isRemovable: valueCopy.length !== 1,
      value,
    }));
  }

  get defaultChildValue() {
    if (this.defaultItem) {
      return this.defaultItem;
    }
    if (this.widget === InputTextWidget) {
      return '';
    } else {
      return [];
    }
  }

  addFieldSet() {
    this.updateValue([...this.value, _.cloneDeep(this.defaultChildValue)]);
  }

  removeChild(index: number) {
    const newValue = [...this.value];
    newValue.splice(index, 1);
    this.updateValue(newValue);
  }

  updateChildValue(childValue: any, index: number) {
    const newValue = [...this.value];
    if (this.value.length < index) {
      newValue.push(childValue);
    } else {
      newValue[index] = childValue;
    }
    this.updateValue(newValue);
  }

  updateValue(newValue: Record<string, any>[]) {
    this.$emit('input', newValue);
  }
}
</script>
<style lang="scss" scoped>
@import '../../../styles/_variables';
.fa-plus-circle {
  color: $active-color;
}

.widget-list__container {
  @extend %form-widget__container;
  ::v-deep.multiselect__tags {
    @extend %form-widget__field;
    background: #fff;
  }
}

.widget-list__container label {
  @extend %form-widget__label;
}

.widget-list__body {
  background: none;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
}

.widget-list__child {
  width: 100%;
  padding-right: 15px;
  position: relative;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.widget-list__component {
  background-color: #f8f8f8;
  width: 98%;
  padding: 8px 8px 0;

  ::v-deep label {
    width: 40%;
  }

  ::v-deep label + div {
    width: 60%;
  }
}
.widget-list__component-sep {
  font-size: 14px;
}

.widget-list__add-fieldset {
  @extend %button-default;
  align-self: center;
  background-color: #f8f8f8;
  border: 1px dashed $active-color;
  color: $active-color;
  font-weight: 500;
  width: 250px;
}

.widget-list__icon {
  margin-top: 8px;
  position: absolute;
  right: 0;
  top: calc(50% - 16px);
  cursor: pointer;
}
</style>
<style lang="scss">
.widget-list__container .widget-autocomplete__container {
  align-items: center;
  flex-direction: row;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.widget-list__container .widget-autocomplete__label {
  margin-bottom: 0px;
  width: 40%;
}
</style>
