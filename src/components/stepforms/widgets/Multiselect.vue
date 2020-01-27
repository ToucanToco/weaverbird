<template>
  <div class="widget-multiselect__container" :class="toggleClassErrorWarning">
    <label class="widget-multiselect__label" :for="id">{{ name }}</label>
    <multiselect
      v-model="editedValue"
      :options="options"
      :placeholder="placeholder"
      :multiple="true"
      :taggable="true"
      :close-on-select="false"
    />
    <div v-if="messageError" class="field__msg-error">
      <span class="fa fa-exclamation-circle" />
      {{ messageError }}
    </div>
  </div>
</template>

<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Mixins,Prop, Watch } from 'vue-property-decorator';

import FormWidget from './FormWidget.vue';

@Component({
  name: 'multiselect-widget',
  components: {
    Multiselect,
  },
})
export default class MultiselectWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ type: Array, default: () => [] })
  value!: string[];

  @Prop({ type: Array, default: () => [] })
  options!: string[];

  editedValue: string[] = [];

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string[]) {
    this.editedValue = newValue;
  }

  @Watch('editedValue')
  updateValue(newValue: string[]) {
    this.$emit('input', newValue);
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style lang="scss">
@import '../../../styles/_variables';
.widget-multiselect__container {
  @extend %form-widget__container;
  position: relative;
}

.multiselect {
  color: $base-color-light;
  font-size: 14px;
}

.multiselect .multiselect__placeholder {
  margin-bottom: 0;
  color: $grey-dark;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

.multiselect__single {
  background-color: transparent;
  color: $base-color-light;
  font-size: 14px;
  margin-bottom: 0;
}

.multiselect--active {
  & > .multiselect__tags {
    @extend %form-widget__field--focused;
  }
}

.multiselect__option {
  font-size: 14px;
  box-shadow: inset 0 -1px 0 0 #f1f1f1;
  &:after {
    display: none;
  }
}

.multiselect__option--selected {
  background-color: $active-color;
  color: $base-color-light;
  font-weight: normal;
  color: #fff;
}

.multiselect__option--selected.multiselect__option--highlight {
  background-color: $active-color;
  color: #fff;
}

.multiselect__option--highlight {
  background-color: #f8f8f8;
  color: $base-color-light;
}

.widget-multiselect__label {
  @extend %form-widget__label;
}

.multiselect__tags {
  @extend %form-widget__field;
  border-radius: 0;
  border: none;
  font-size: 14px;
  max-height: none;
  display: block;
  padding-right: 30px;
  & > input {
    background: transparent;
    margin-bottom: 0;
    &::placeholder {
      color: $grey-dark;
    }
  }
}

.multiselect__tags .multiselect__tag {
  background: $active-color;
}

.multiselect__tags .multiselect__tag-icon {
  background: $active-color;
  &:after {
    // color: #fff;
    // color: $grey;
    color: rgba(255, 255, 255, 0.75);
  }
  &:hover {
    background: $active-color;
  }
}
</style>
