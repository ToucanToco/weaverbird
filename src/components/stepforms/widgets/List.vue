<template>
  <div class="widget-list__container" :class="toggleClassErrorWarning">
    <label :for="id">{{ name }}</label>
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
            @input="updateChildValue($event, index)"
            :data-path="`${dataPath}[${index}]`"
            :errors="errors"
          />
        </div>
        <div class="widget-list__icon" v-if="child.isRemovable" @click="removeChild(index)">
          <i class="far fa-trash-alt" />
        </div>
      </div>
      <div v-if="messageError" class="field__msg-error">
        <span class="fa fa-exclamation-circle" />
        {{ messageError }}
      </div>
      <button v-if="!automaticNewField" class="widget-list__add-fieldset" @click="addFieldSet">
        <i class="fas fa-plus-circle" />
        {{ addFieldName }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Mixins } from 'vue-property-decorator';
import { VueConstructor } from 'vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import FormWidget from './FormWidget.vue';
import { ErrorObject } from 'ajv';

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

  @Prop({ type: String, default: null })
  id!: string;

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
  defaultItem!: string | RepeatableField;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop({ default: null })
  dataPath!: string;

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
}

.widget-list__container label {
  @extend %form-widget__label;
}

.widget-list__body {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.widget-list__child {
  width: 100%;
  padding-right: 15px;
  position: relative;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
}

.widget-list__component {
  background-color: #f8f8f8;
  width: 98%;
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
.widget-list__component .multiselect {
  width: 60%;
}
</style>
