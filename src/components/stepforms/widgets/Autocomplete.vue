<template>
  <div class="widget-autocomplete__container" :class="toggleClassErrorWarning">
    <label class="widget-autocomplete__label" v-if="name" :for="id">{{ name }}</label>
    <multiselect
      v-model="editedValue"
      :options="options"
      :placeholder="placeholder"
      :allow-empty="false"
      :track-by="trackBy"
      :label="label"
    />
    <div v-if="messageError" class="field__msg-error">
      <span class="fa fa-exclamation-circle" />
      {{ messageError }}
    </div>
  </div>
</template>

<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';

import FormWidget from './FormWidget.vue';

@Component({
  name: 'autocomplete-widget',
  components: {
    Multiselect,
  },
})
export default class AutocompleteWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: null })
  id!: string;

  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | object;

  @Prop({ type: Array, default: () => [] })
  options!: string[];

  @Prop({ type: String, default: undefined })
  trackBy!: string;

  @Prop({ type: String, default: undefined })
  label!: string;

  editedValue = '';

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string) {
    this.editedValue = newValue;
  }

  @Watch('editedValue')
  updateValue(newValue: string) {
    this.$emit('input', newValue);
  }
}
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>
<style lang="scss">
@import '../../../styles/_variables';

.widget-autocomplete__container {
  @extend %form-widget__container;
  position: relative;
}

.multiselect {
  color: $base-color-light;
  font-size: 14px;
}

.multiselect .multiselect__placeholder {
  color: $grey-dark;
  font-size: 12px;
  margin-bottom: 0;
  color: $base-color;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
}

.multiselect__tags {
  @extend %form-widget__field;
  border-radius: 0;
  border: none;
  font-size: 14px;
  & > input {
    background: transparent;
    margin-bottom: 0;
    &::placeholder {
      font-size: 12px;
      color: $grey-dark;
    }
  }
}

.widget-autocomplete__container .multiselect__single {
  background-color: transparent;
  color: $base-color-light;
  font-size: 14px;
  margin-bottom: 0;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  white-space: nowrap;
}

.widget-autocomplete__container .multiselect__content-wrapper {
  min-width: 100%;
  width: auto;
}

.multiselect__single,
.multiselect__input {
  padding-left: 0;
  line-height: 24px;
}

.multiselect__single,
.multiselect__input {
  padding-left: 0;
  line-height: 24px;
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

.multiselect__element .multiselect__option--selected {
  background: $active-color;
  color: #fff;
  font-weight: normal;
}

.multiselect__element .multiselect__option--selected.multiselect__option--highlight {
  background: $active-color;
  color: #fff;
}

.multiselect__element .multiselect__option--highlight {
  background: $active-color-faded-2;
  color: $active-color;
}

.widget-autocomplete__label {
  @extend %form-widget__label;
}
</style>
