<template>
  <popover
    class="widget-variable-chooser"
    :visible="isOpened"
    :align="alignLeft"
    bottom
    @closed="close"
  >
    <div class="widget-variable-chooser__list-container">
      <VariableList
        :isMultiple="isMultiple"
        :selectedVariables="selectedVariables"
        :availableVariables="availableVariables"
        @input="chooseVariable"
        @addAdvancedVariable="addAdvancedVariable"
      />
    </div>
  </popover>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import { POPOVER_ALIGN } from '@/components/constants';
import Popover from '@/components/Popover.vue';
import type { VariablesBucket } from '@/lib/variables';

import VariableList from './VariableList.vue';

/**
 * This component list all the available variables to use as value in VariableInputs
 */
export default defineComponent({
  name: 'variable-chooser',
  
  components: { 
    Popover, 
    VariableList 
  },
  
  props: {
    isMultiple: {
      type: Boolean,
      default: false
    },
    selectedVariables: {
      type: [String, Array] as PropType<string | string[]>,
      default: () => ''
    },
    availableVariables: {
      type: Array as PropType<VariablesBucket>,
      default: () => []
    },
    isOpened: {
      type: Boolean,
      default: false
    }
  },
  
  data() {
    return {
      alignLeft: POPOVER_ALIGN.LEFT
    };
  },
  
  methods: {
    close() {
      this.$emit('closed');
    },
    
    /**
     * Emit the choosen variable(s)
     */
    chooseVariable(selectedVariables: string | string[]) {
      this.$emit('input', selectedVariables);
    },
    
    addAdvancedVariable() {
      this.$emit('addAdvancedVariable');
    }
  }
});
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
.widget-variable-chooser__list-container {
  border-radius: 2px;
  width: 300px;
  max-height: 300px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
  overflow: hidden;
  overflow-y: auto;
}
</style>
