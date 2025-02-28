<template>
  <div class="widget-input-number__container" :class="toggleClassErrorWarning">
    <div class="widget-input-number__container">
      <label v-if="name" @click="$refs.input.focus()">{{ name }}</label>
      <a v-if="docUrl" :href="docUrl" target="_blank" rel="noopener">
        <FAIcon class="widget-input-number__doc-icon" icon="question-circle" />
      </a>
    </div>
    <VariableInput
      :value="value"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :has-arrow="true"
      @input="updateValue"
    >
      <input
        ref="input"
        :class="elementClass"
        :placeholder="placeholder"
        type="number"
        :min="min"
        :max="max"
        :value="value"
        @blur="blur()"
        @focus="focus()"
        @input="updateValue($event.target.value)"
      />
    </VariableInput>
    <div v-if="messageError" class="field__msg-error">
      <FAIcon icon="exclamation-circle" />
      {{ messageError }}
    </div>
    <div v-if="messageWarning" class="field__msg-warning">
      <FAIcon icon="exclamation-triangle" />
      {{ messageWarning }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import FAIcon from '@/components/FAIcon.vue';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import FormWidget from './FormWidget.vue';
import VariableInput from './VariableInput.vue';

export default defineComponent({
  name: 'input-number-widget',
  components: {
    VariableInput,
    FAIcon,
  },
  extends: FormWidget,
  props: {
    name: {
      type: String as PropType<string>,
      default: '',
    },
    placeholder: {
      type: String as PropType<string>,
      default: '',
    },
    value: {
      type: [String, Number, Boolean] as PropType<string | number | boolean | undefined>,
      default: '',
    },
    docUrl: {
      type: String as PropType<string | undefined>,
      default: undefined,
    },
    min: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
    max: {
      type: Number as PropType<number | undefined>,
      default: undefined,
    },
    availableVariables: {
      type: Object as PropType<VariablesBucket | undefined>,
      default: undefined,
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters | undefined>,
      default: undefined,
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters | undefined>,
      default: undefined,
    },
  },
  data() {
    return {
      isFocused: false,
    };
  },
  computed: {
    elementClass() {
      return {
        'widget-input-number': true,
        'widget-input-number--focused': this.isFocused,
        'widget-input--with-variables': !!this.availableVariables,
      };
    },
  },
  methods: {
    blur() {
      this.isFocused = false;
    },
    focus() {
      this.isFocused = true;
    },
    updateValue(newValue: string) {
      this.$emit('input', Number(newValue));
    },
  },
});
</script>

<style lang="scss" scoped>
@import '../../../styles/_variables';

.widget-input-number__container {
  @extend %form-widget__container;
}

.widget-input-number {
  @extend %form-widget__field;
  padding: 8px;
}

.widget-input-number--focused {
  @extend %form-widget__field--focused;
}

.widget-input-number__container {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.widget-input-number__container label {
  @extend %form-widget__label;
}

.widget-input-number__doc-icon {
  margin-left: 5px;
  color: $base-color;
  font-size: 14px;

  &:hover {
    color: $active-color;
  }
}

.widget-input--with-variables {
  padding-right: 35px;
  text-overflow: ellipsis;
}
</style>
