<template>
  <div class="widget-multiinputtext__container">
    <component
      :is="variableInputMode"
      :value="value"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      @input="updateValue"
    >
      <multiselect
        class="widget-multiinputtext__multiselect"
        :class="{ 'widget-multiinputtext__multiselect--big': isMultiselectBig }"
        :value="value"
        @input="updateValue"
        :options="options"
        :multiple="true"
        :taggable="true"
        :close-on-select="false"
        :placeholder="placeholder"
        @search-change="updateOptions"
        open-direction="bottom"
      >
        <template
          v-if="multiVariable && availableVariables"
          slot="tag"
          slot-scope="{ option, remove }"
        >
          <VariableTag
            class="multiselect__tag widget-multiinputtext__tag"
            v-if="isVariable(option)"
            :available-variables="availableVariables"
            :variable-delimiters="variableDelimiters"
            :value="option"
            @removed="remove(option)"
          />
          <span class="multiselect__tag widget-multiinputtext__tag" @click.prevent.stop="" v-else>
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
    </component>
  </div>
</template>

<script lang="ts">
import Multiselect from 'vue-multiselect';
import { Component, Prop, Vue } from 'vue-property-decorator';

import VariableTag from '@/components/stepforms/widgets/VariableInputs/VariableTag.vue';
import { extractVariableIdentifier, VariableDelimiters, VariablesBucket } from '@/lib/variables';

import MultiVariableInput from './MultiVariableInput.vue';
import VariableInput from './VariableInput.vue';

@Component({
  name: 'multi-input-text-widget',
  components: {
    Multiselect,
    VariableTag,
  },
})
export default class MultiInputTextWidget extends Vue {
  @Prop({ type: String, default: '' })
  name!: string;

  @Prop({ type: String, default: '' })
  placeholder!: string;

  @Prop({ default: () => [] })
  value!: string[] | string;

  @Prop()
  availableVariables!: VariablesBucket;

  @Prop()
  variableDelimiters!: VariableDelimiters;

  @Prop()
  advancedVariableDelimiters!: VariableDelimiters;

  @Prop({ default: true })
  multiVariable!: boolean;

  options: string[] = [];

  get variableInputMode() {
    return this.multiVariable ? MultiVariableInput : VariableInput;
  }

  get isMultiselectBig() {
    // add overflow to tag container when there is a lot of values
    return Array.isArray(this.value) && this.value.length > 6;
  }

  updateOptions(newVal: string) {
    if (newVal.length > 0) {
      this.options = [newVal];
    }
  }

  updateValue(newValue: string[] | string | undefined) {
    if (newValue === undefined) {
      this.$emit('input', []);
    } else {
      this.$emit('input', newValue);
    }
    this.options = [];
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

.widget-multiinputtext__container {
  @extend %form-widget__container;
  position: relative;
}

.widget-multiinputtext__multiselect {
  // Prevent multi-select to overlap things put before it, like the variable button
  isolation: isolate;

  &.multiselect--active {
    z-index: 0;
  }
}

// TODO project-wide multiselect styles should be extracted from this components into a specific stylesheet, so we could scope this one.
.multiselect {
  color: $base-color-light;
  font-size: 14px;
}
.multiselect .multiselect__placeholder {
  margin-bottom: 0;
  color: $grey-dark;
  font-size: 14px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 100%;
  padding: 0;
  line-height: 20px;
  padding-left: 5px;
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
.widget-multiinputtext__label {
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
  height: 40px;
  overflow: hidden;
  & > input {
    background: transparent;
    margin-bottom: 0;
    &::placeholder {
      color: $grey-dark;
    }
  }
}
.multiselect--active .multiselect__tags {
  overflow: visible;
  height: auto;
}
.widget-multiinputtext__container {
  .multiselect__content-wrapper {
    display: none !important;
  }
  .multiselect__tags {
    background: none;
    box-shadow: rgb(241, 241, 241) 0px 0px 0px 1px inset;
    display: flex;
    position: absolute;
    overflow: hidden;
    height: 40px;
    flex-direction: column;
    align-items: flex-start;
    padding: 0;
    width: 100%;
  }
  .multiselect__placeholder {
    padding: 8px 30px 8px 10px;
  }
  .multiselect__tags-wrap {
    order: 2;
    padding: 8px 8px 8px 8px;
    width: 100%;
  }
  .multiselect__input {
    border-radius: 0px;
    order: 1;
    padding: 4px 10px 11px;
    left: 0px;
    position: relative;
    box-shadow: rgb(241, 241, 241) 0px 0px 0px 1px inset;
    height: 40px;
  }
  .multiselect--active .multiselect__tags {
    overflow: visible;
    height: auto;
  }
  .multiselect--active {
    .multiselect__tags {
      box-shadow: none;
    }
    .multiselect__tags-wrap {
      background: #fff;
      box-shadow: rgb(241, 241, 241) 0px 0px 0px 1px inset;
      border-radius: 0 0 5px 5px;
      padding: 8px 10px;
      max-height: 200px;
    }
    .multiselect__input {
      box-shadow: 0 0 0 1px #2665a3 inset;
    }
  }
  // The selection caret is useless in this widget
  .multiselect__select {
    display: none;
  }
}

.widget-multiinputtext__multiselect--big.multiselect--active {
  .multiselect__tags-wrap {
    // We can overflow only when there is more than one line (enough place to display tooltip at top or bottom of a tag)
    overflow-y: auto;
  }
}

.multiselect__select:before {
  border: 0;
  content: '\f078';
  font-family: 'Font Awesome 5 Pro', 'Font Awesome 5 Free';
  font-weight: 900;
  line-height: 1;
  top: 8px;
}
.multiselect__tags .multiselect__tag {
  background: $active-color;
}
.multiselect__tags .multiselect__tag-icon {
  background: $active-color;
  &:after {
    color: rgba(255, 255, 255, 0.75);
  }
  &:hover {
    background: $active-color;
  }
}
</style>

<style scoped lang="scss">
.widget-multiinputtext__multiselect {
  &:not(.multiselect--active) {
    /deep/ .multiselect__tags-wrap {
      padding-right: 40px;
    }
  }
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
