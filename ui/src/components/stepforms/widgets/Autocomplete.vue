<template>
  <div
    class="widget-autocomplete__container"
    data-cy="weaverbird-autocomplete"
    :class="toggleClassErrorWarning"
  >
    <label class="widget-autocomplete__label" v-if="name">{{ name }}</label>
    <VariableInput
      :value="value"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :has-arrow="true"
      @input="updateValue"
    >
      <multiselect
        :value="value"
        :class="{ 'widget-autocomplete__multiselect--with-example': withExample }"
        :options="options"
        :placeholder="placeholder"
        :allow-empty="false"
        :track-by="trackBy"
        :label="label"
        :maxHeight="maxHeight"
        openDirection="bottom"
        @input="updateValue"
        @search-change="onSearchChange"
        ref="multiSelect"
      >
        <!-- If you want to use those templates, you should provide a 'label' key in the options -->
        <template v-if="options[0] && options[0].label" #singleLabel="props">
          <span class="option__title">{{ props.option.label }}</span>
        </template>
        <template v-if="options[0] && options[0].label" #option="props">
          <div
            class="option__container"
            :class="{
              'option__container--disabled': props.option.disabled,
            }"
            :title="props.option.tooltip"
            @click="onOptionClick($event, props.option.disabled)"
          >
            <div class="option__title" :title="props.option.label">{{ props.option.label }}</div>
            <!-- To display an example - e.g. "Wed Jan 04 2023" for "Today" label -
                you should provide a 'example' key in the options -->
            <div v-if="withExample" class="option__example">{{ props.option.example }}</div>
          </div>
        </template>
        <template #afterList v-if="allowCustom">
          <li
            class="multiselect__element"
            @click="onSelectCustom"
            v-if="searchValue && !isSearchValueInOptions"
          >
            <span class="multiselect__option"
              ><span
                >Use <em>{{ searchValue }}</em></span
              ></span
            >
          </li>
        </template>
      </multiselect>
    </VariableInput>
    <div v-if="messageError" class="field__msg-error">
      <FAIcon icon="exclamation-circle" />
      {{ messageError }}
    </div>
  </div>
</template>

<script lang="ts">
import { Multiselect } from 'vue-multiselect';
import { Component, Prop } from 'vue-property-decorator';

import FAIcon from '@/components/FAIcon.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import FormWidget from './FormWidget.vue';
import VariableInput from './VariableInput.vue';

@Component({
  name: 'autocomplete-widget',
  components: {
    Multiselect,
    VariableInput,
    FAIcon,
  },
})
export default class AutocompleteWidget extends FormWidget {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: '' })
  value!: string | object;

  @Prop({ type: Array, default: () => [] })
  options!: string[] | object[];

  @Prop({ type: String, default: undefined })
  trackBy!: string;

  @Prop({ type: String, default: undefined })
  label!: string;

  @Prop({ type: Boolean, default: false })
  withExample!: boolean;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop()
  trustedVariableDelimiters?: VariableDelimiters;

  @Prop({ type: Number, default: undefined })
  maxHeight!: number;

  // Allow typing a value which is not on the list.
  // Won't work for object options.
  @Prop({ type: Boolean, default: false })
  allowCustom!: boolean;

  updateValue(newValue?: string | object) {
    this.$emit('input', newValue);
  }

  onOptionClick(e: Event, disabled?: boolean) {
    if (disabled) e.stopPropagation();
  }

  searchValue: string = '';
  onSearchChange(v: string) {
    this.searchValue = v;
  }

  get isSearchValueInOptions(): boolean {
    return this.options.includes(this.searchValue);
  }

  onSelectCustom() {
    this.updateValue(this.searchValue);
    (this.$refs.multiSelect as Multiselect).deactivate();
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
  color: $base-color;
  font-size: 12px;
  margin-bottom: 0;
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

.option__container {
  display: flex;
  justify-content: space-between;
}

.option__example {
  font-style: italic;
}

.widget-autocomplete__multiselect--with-example {
  .multiselect__option {
    display: flex;
    padding: 0;
  }

  .option__container {
    padding: 10px;
    align-items: center;
    width: 100%;
  }

  .option__container--disabled {
    &,
    &:hover {
      background: #ededed;
      color: #a6a6a6;
    }
    cursor: not-allowed;
    .option__title {
      pointer-events: none;
    }
  }
}
</style>
