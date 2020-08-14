<template>
  <div class="widget-multiselect__container" :class="toggleClassErrorWarning">
    <label class="widget-multiselect__label">{{ name }}</label>
    <MultiVariableInput
      :value="value"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :has-arrow="true"
      @input="updateValue"
    >
      <multiselect
        class="widget-multiselect__multiselect"
        v-model="editedValue"
        :options="options"
        :placeholder="placeholder"
        :track-by="trackBy"
        :label="label"
        :multiple="true"
        :taggable="true"
        :close-on-select="false"
        openDirection="bottom"
      >
        <!-- If you want to use those templates you should provide a 'label' and 
    'example' key in the options-->
        <template v-if="withExample" slot="singleLabel" slot-scope="props">
          <span class="option__title">{{ props.option.label }}</span>
        </template>
        <template v-if="withExample" slot="option" slot-scope="props">
          <div class="option__container" :title="props.option.tooltip">
            <div class="option__title">{{ props.option.label }}</div>
            <div class="option__example">{{ props.option.example }}</div>
          </div>
        </template>
        <template slot="tag" slot-scope="{ option, remove }">
          <VariableTag
            class="multiselect__tag widget-multiselect__tag"
            v-if="isVariable(option)"
            :available-variables="availableVariables"
            :variable-delimiters="variableDelimiters"
            :value="option"
            @removed="remove(option)"
          />
          <span class="multiselect__tag widget-multiselect__tag" v-else>
            <span v-html="option" />
            <i
              tabindex="1"
              class="multiselect__tag-icon"
              @keypress.enter.prevent="remove(option)"
              @mousedown.prevent="remove(option)"
            />
          </span>
        </template>
      </multiselect>
    </MultiVariableInput>
    <div v-if="messageError" class="field__msg-error">
      <span class="fa fa-exclamation-circle" />
      {{ messageError }}
    </div>
  </div>
</template>

<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator';

import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';
import { extractVariableIdentifier, VariableDelimiters, VariablesBucket } from '@/lib/variables';

import FormWidget from './FormWidget.vue';
import MultiVariableInput from './MultiVariableInput.vue';

@Component({
  name: 'multiselect-widget',
  components: {
    Multiselect,
    VariableTag,
    MultiVariableInput,
  },
})
export default class MultiselectWidget extends Mixins(FormWidget) {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ type: Array, default: () => [] })
  value!: string[];

  @Prop({ type: Array, default: () => [] })
  options!: string[];

  @Prop({ type: String, default: undefined })
  trackBy!: string;

  @Prop({ type: String, default: undefined })
  label!: string;

  @Prop({ type: Boolean, default: false })
  withExample!: boolean;

  @Prop()
  availableVariables!: VariablesBucket[];

  @Prop()
  variableDelimiters!: VariableDelimiters;

  editedValue: string[] = [];

  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string[]) {
    this.editedValue = newValue;
  }

  @Watch('editedValue')
  updateValue(newValue: string[]) {
    this.$emit('input', newValue);
  }

  /**
   * Verify if we need to use regular template or variable one
   **/
  isVariable(value: string) {
    const identifier = extractVariableIdentifier(value, this.variableDelimiters);
    return identifier != null;
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

<style scoped lang="scss">
/deep/ .widget-variable__toggle {
  top: 10px;
  bottom: auto;
  z-index: 50;
}
.widget-multiselect__multiselect {
  /deep/ .widget-variable__tag {
    display: inline-flex;
    margin-right: 10px;
    padding: 0;
  }
  /deep/ .widget-variable__tag-icon {
    margin: 0 0.5em;
  }
  /deep/ .widget-variable__tag-close {
    font-size: 10px;
    padding: 0.6em 0.5em;
  }
}
</style>
