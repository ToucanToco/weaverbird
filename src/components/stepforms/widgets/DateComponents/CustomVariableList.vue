<template>
  <div
    class="widget-custom-variable-list"
    :class="{ 'widget-custom-variable-list--advanced': enableAdvancedVariable }"
  >
    <VariableListOption
      v-if="enableCustom"
      class="widget-custom-variable-list__custom-option"
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
import { Component, Prop, Vue } from 'vue-property-decorator';

import VariableList from '@/components/stepforms/widgets/VariableInputs/VariableList.vue';
import VariableListOption from '@/components/stepforms/widgets/VariableInputs/VariableListOption.vue';
import { VariablesBucket } from '@/lib/variables';
/**
 * This component list all the available variables to use as value in DateInputs
 */
@Component({
  name: 'custom-variable-list',
  components: { VariableList, VariableListOption },
})
export default class CustomVariableList extends Vue {
  @Prop({ default: () => '' })
  selectedVariables!: string;

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  @Prop({ default: true })
  enableCustom!: boolean;

  @Prop({ default: () => true })
  enableAdvancedVariable!: boolean;

  @Prop({ default: () => 'Custom', type: String })
  customLabel!: string;

  @Prop({ default: true })
  showOnlyLabel!: boolean;

  chooseVariable(variableIdentifier: string) {
    this.$emit('input', variableIdentifier);
  }

  selectCustomVariable() {
    this.$emit('selectCustomVariable');
  }

  addAdvancedVariable() {
    this.$emit('addAdvancedVariable');
  }
}
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
