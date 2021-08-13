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
      />
      <div class="widget-advanced-variable" @click="addAdvancedVariable">
        Advanced variable
      </div>
    </div>
  </popover>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import Popover from '@/components/Popover.vue';
import { VariablesBucket } from '@/lib/variables';

import VariableList from './VariableList.vue';
/**
 * This component list all the available variables to use as value in VariableInputs
 */
@Component({
  name: 'variable-chooser',
  components: { Popover, VariableList },
})
export default class VariableChooser extends Vue {
  @Prop({ default: false })
  isMultiple!: boolean;

  @Prop({ default: () => '' })
  selectedVariables!: string | string[];

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: false })
  isOpened!: boolean;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  close() {
    this.$emit('closed');
  }

  /**
   * Emit the choosen variable(s)
   */
  chooseVariable(selectedVariables: string | string[]) {
    this.$emit('input', selectedVariables);
  }

  addAdvancedVariable() {
    this.$emit('addAdvancedVariable');
  }
}
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
.widget-advanced-variable {
  padding: 12px;
  font-size: 12px;
  font-weight: 500;
  text-align: center;
  background: #f5f5f5;
  color: #888888;
  cursor: pointer;
  margin-top: 8px;

  &:hover {
    text-decoration: underline;
  }
}
</style>
