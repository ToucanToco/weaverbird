<template>
  <div
    class="widget-custom-variable-list"
    data-cy="weaverbird-date-input-variables"
    :class="{ 'widget-custom-variable-list--advanced': enableAdvancedVariable }"
  >
    <VariableListOption
      v-if="enableCustom"
      class="widget-custom-variable-list__custom-option"
      data-cy="weaverbird-date-input-custom"
      :label="customLabel"
      identifier="custom"
      :selectedVariables="selectedVariables"
      @input="selectCustomVariable"
    />
    <VariableList
      :selectedVariables="selectedVariables"
      :availableVariables="availableVariables"
      :enableAdvancedVariable="enableAdvancedVariable"
      :showOnlyLabel="showOnlyLabel"
      @input="chooseVariable"
      @addAdvancedVariable="addAdvancedVariable"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import VariableList from '@/components/stepforms/widgets/VariableInputs/VariableList.vue';
import VariableListOption from '@/components/stepforms/widgets/VariableInputs/VariableListOption.vue';
import type { VariablesBucket } from '@/lib/variables';
/**
 * This component list all the available variables to use as value in DateInputs
 */
export default defineComponent({
  name: 'custom-variable-list',

  components: {
    VariableList,
    VariableListOption,
  },

  props: {
    selectedVariables: {
      type: String,
      default: '',
    },
    availableVariables: {
      type: Array as PropType<VariablesBucket>,
      default: () => [],
    },
    enableCustom: {
      type: Boolean,
      default: true,
    },
    enableAdvancedVariable: {
      type: Boolean,
      default: true,
    },
    customLabel: {
      type: String,
      default: 'Custom',
    },
    showOnlyLabel: {
      type: Boolean,
      default: true,
    },
  },

  methods: {
    chooseVariable(variableIdentifier: string) {
      this.$emit('input', variableIdentifier);
    },

    selectCustomVariable() {
      this.$emit('selectCustomVariable');
    },

    addAdvancedVariable() {
      this.$emit('addAdvancedVariable');
    },
  },
});
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
.widget-custom-variable-list {
  width: 200px;
  background-color: #fff;
  margin-bottom: 8px;
  padding-top: 10px;
}
.widget-custom-variable-list__custom-option {
  margin: 0 8px;
}
::v-deep .widget-variable-list__section:first-child {
  padding-top: 0;
}
.widget-custom-variable-list--advanced {
  margin-bottom: 0;
}
</style>
