<template>
  <div
    class="widget-variable__tag"
    :class="{
      'widget-variable__tag--advanced': isAdvancedVariable,
      'widget-variable__tag--date': isDate,
    }"
    v-tooltip="{
      targetClasses: 'has-weaverbird__tooltip',
      classes: 'weaverbird__tooltip',
      content: variableValue,
      placement: 'bottom-center',
    }"
  >
    <span class="widget-variable__tag-icon">
      <FAIcon v-if="isDate" icon="far clock" />
      <template v-else>{}</template>
    </span>
    <span
      class="widget-variable__tag-name"
      @keypress.enter.prevent="editAdvancedVariable"
      @mousedown.prevent="editAdvancedVariable"
      >{{ variableLabel }}</span
    >
    <span
      class="widget-variable__tag-close"
      tabindex="1"
      @keypress.enter.prevent="removeVariableTag"
      @mousedown.prevent="removeVariableTag"
    >
      <FAIcon icon="times" />
    </span>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Vue from 'vue';
import VTooltip from 'v-tooltip';

import FAIcon from '@/components/FAIcon.vue';
import { extractVariableIdentifier } from '@/lib/variables';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

Vue.use(VTooltip);

/**
 * This component display a variable based on a human readable format and allow to delete it
 */
export default defineComponent({
  name: 'variable-tag',
  
  components: {
    FAIcon,
  },
  
  props: {
    value: {
      type: String,
      required: true
    },
    availableVariables: {
      type: Array as PropType<VariablesBucket>,
      default: () => []
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined
    },
    isDate: {
      type: Boolean,
      default: false
    }
  },
  
  computed: {
    /**
     * Retrieve identifier by removing delimiters from value.
     */
    variableIdentifier() {
      return extractVariableIdentifier(
        this.value,
        this.variableDelimiters,
        this.trustedVariableDelimiters,
      );
    },
    
    /**
     * Retrieve variable in available variables by identifier.
     */
    variable() {
      return this.availableVariables.find((aV) => aV.identifier === this.variableIdentifier);
    },
    
    /*
    TO_FIX: every variable not found in availableVariables is an advanced variable
    */
    isAdvancedVariable() {
      return !this.variable;
    },
    
    /**
     * Display label rather than identifier if available.
     */
    variableLabel() {
      if (this.variable) {
        return this.variable.label;
      } else if (this.isDate) {
        return this.variableIdentifier;
      } else {
        return 'AdVariable';
      }
    },
    
    /**
     * Display as list if value is an array.
     */
    variableValue() {
      const value = this.variable?.value || '';
      return Array.isArray(value) ? value.join(', ') : value;
    }
  },
  
  methods: {
    removeVariableTag() {
      this.$emit('removed');
    },
    
    editAdvancedVariable() {
      if (this.isAdvancedVariable) {
        this.$emit('edited', this.value);
      }
    }
  }
});
</script>

<style lang="scss">
@import '../../../../styles/utils/v-tooltip.scss';
</style>

<style scoped lang="scss">
@import '../../../../styles/variables';

.widget-variable__tag {
  border-radius: 4px;
  background-color: $active-color-faded-3;
  padding: 0 10px;
  color: $active-color;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.widget-variable__tag-close {
  cursor: pointer;
}

.widget-variable__tag-icon {
  margin-right: 1em;
}

.widget-variable__tag-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.widget-variable__tag--advanced {
  &:hover .widget-variable__tag-name {
    cursor: pointer;
    text-decoration: underline;
  }
}
.widget-variable__tag--date {
  .widget-variable__tag-icon {
    margin-right: 0.5em;
    font-size: 10px;
  }
}
</style>
