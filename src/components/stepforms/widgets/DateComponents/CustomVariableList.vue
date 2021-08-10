<template>
  <div class="widget-custom-variable-list__container">
    <VariableList
      :selectedVariables="selectedVariables"
      :availableVariables="availableVariables"
      @input="chooseVariable"
    />
    <VariableListOption
      class="widget-custom-variable-list__custom-option"
      label="Custom"
      identifier="custom"
      :selectedVariables="selectedVariables"
      @input="selectCustomVariable"
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

  chooseVariable(variableIdentifier: string) {
    this.$emit('input', variableIdentifier);
  }

  selectCustomVariable() {
    this.$emit('selectCustomVariable');
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
.widget-custom-variable-list__container {
  width: 200px;
  background-color: #fff;
}
.widget-custom-variable-list__custom-option {
  margin: 0 8px 8px;
}
</style>
