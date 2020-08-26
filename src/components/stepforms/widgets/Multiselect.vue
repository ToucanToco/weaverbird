<template>
  <div class="widget-multiselect__container" :class="toggleClassErrorWarning">
    <label class="widget-multiselect__label">{{ name }}</label>
    <MultiVariableInput
      class="widget-multiselect__multi-variable"
      :value="stringValue"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :has-arrow="true"
      @input="updateStringValue"
    >
      <multiselect
        class="widget-multiselect__multiselect"
        v-model="editedValue"
        :options="options"
        :placeholder="placeholder"
        :trackBy="trackBy"
        :label="label"
        :multiple="true"
        :taggable="true"
        :closeOnSelect="false"
        openDirection="bottom"
        :customLabel="customLabel"
      >
        <!-- If you want to use those templates you should provide a 'label' and 'example' key in the options-->
        <template v-if="withExample" slot="option" slot-scope="props">
          <div class="option__container" :title="props.option.tooltip">
            <div class="option__title">{{ customLabel(props.option) }}</div>
            <div class="option__example">{{ props.option.example }}</div>
          </div>
        </template>
        <template slot="tag" slot-scope="{ option, remove }">
          <VariableTag
            class="multiselect__tag widget-multiselect__tag"
            v-if="isVariable(option)"
            :available-variables="availableVariables"
            :variable-delimiters="variableDelimiters"
            :value="customLabel(option)"
            @removed="remove(option)"
          />
          <span class="multiselect__tag widget-multiselect__tag" v-else>
            <span v-html="customLabel(option)" />
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
  value!: string[] | object[];

  @Prop({ type: Array, default: () => [] })
  options!: (string | object)[];

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

  editedValue: string[] | object[] = [];

  /**
   * Are the props set up to handle object options?
   */
  get isObjectValue() {
    return this.label != null && this.trackBy != null;
  }

  /**
   * Convert object initial values as string initial values
   *
   * This is useful because MultiVariableInput cannot handle object values
   */
  get stringValue(): string[] {
    if (this.isObjectValue) {
      return this.value.map(this.customLabel);
    }
    return [...this.value];
  }

  /**
   * Initialize the edited value
   */
  @Watch('value', { immediate: true })
  updateEditedValue(newValue: string[] | object[]) {
    this.editedValue = newValue;
  }

  /**
   * Emits an input event each time editedValue moves or a variable is choosen.
   * This event's payload is the value as objects or strings.
   */
  @Watch('editedValue')
  updateStringValue(newValue: string[] | object[], oldValue: string[] | object[]) {
    const newValues = newValue.map(this.customLabel).join(' ');
    const oldValues = oldValue.map(this.customLabel).join(' ');
    // Prevent an infinite loop of emitting and receiving.
    if (newValues !== oldValues) {
      this.$emit('input', newValue);
    }
  }

  /**
   * Verify if we need to use regular template or variable one
   **/
  isVariable(value: string | object) {
    const identifier = extractVariableIdentifier(this.customLabel(value), this.variableDelimiters);
    return identifier != null;
  }

  /**
   * Returns the option's label field if possible,
   * return the whole option otherwise
   */
  customLabel(option: string | object): string {
    if (typeof option === 'object' && this.isObjectValue) {
      return option[this.label];
    } else {
      return option;
    }
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
.widget-multiselect__multi-variable {
  /deep/ .widget-variable__toggle {
    top: 10px;
    bottom: auto;
    z-index: 50;
  }
}

.widget-multiselect__multiselect {
  /deep/ .widget-variable__tag {
    display: inline-flex;
    vertical-align: top;
    margin-bottom: 12px;
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
