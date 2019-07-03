<template>
  <div class="widget-list__container">
    <label :for="id">{{name}}</label>
    <div class="widget-list__body">
      <div class="widget-list__child" v-for="(child, index) in children" :key="index">
        <div class="widget-list__component">
          <component :is="widget" :value="child.value" @input="updateChildValue($event, index)"></component>
        </div>
        <div class="widget-list__icon" v-if="child.isRemovable" @click="removeChild(index)">
          <i class="far fa-trash-alt"></i>
        </div>
      </div>
      <button v-if="!automaticNewField" class="widget-list__add-fieldset" @click="addFieldSet">
        <i class="fas fa-plus-circle"></i>
        {{ addFieldName }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';
import { VueConstructor } from 'vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';

type Field = {
  name: string;
  label?: string;
  value: any;
};

type RepeatableField = Field[];

@Component({
  name: 'widget-list',
})
export default class WidgetList extends Vue {
  @Prop({ type: String, default: '' })
  addFieldName!: string;

  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: Array, default: () => [] })
  value!: any[];

  @Prop({
    type: Function,
    default: WidgetInputText,
  })
  widget!: VueConstructor<Vue>;

  @Prop({ type: Boolean, default: true })
  automaticNewField!: boolean;

  @Prop({ default: null })
  defaultItem!: string | RepeatableField;

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
    if (this.widget === WidgetInputText) {
      return '';
    } else {
      return [];
    }
  }

  addFieldSet() {
    this.updateValue([...this.value, this.defaultChildValue]);
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
@import '../../styles/_variables';
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
  position: absolute;
  right: 0;
  top: calc(50% - 16px);
  cursor: pointer;
}
</style>