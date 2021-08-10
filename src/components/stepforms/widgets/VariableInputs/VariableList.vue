<template>
  <div class="widget-variable-list">
    <div
      class="widget-variable-list__section"
      v-for="category in variablesByCategory"
      :key="category.label"
    >
      <div class="widget-variable-list__section-title" v-if="category.label">
        {{ category.label }}
      </div>
      <VariableListOption
        v-for="availableVariable in category.variables"
        :key="availableVariable.identifier"
        :value="availableVariable.value"
        :identifier="availableVariable.identifier"
        :label="availableVariable.label"
        :togglable="isMultiple"
        :selectedVariables="selectedVariables"
        @input="chooseVariable"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { VariablesBucket, VariablesCategory } from '@/lib/variables';

import VariableListOption from './VariableListOption.vue';
/**
 * This component list all the available variables to use as value in VariableInputs
 */
@Component({
  name: 'variable-list',
  components: { VariableListOption },
})
export default class VariableChooser extends Vue {
  @Prop({ default: false })
  isMultiple!: boolean;

  @Prop({ default: () => [] })
  selectedVariables!: string[];

  @Prop({ default: () => [] })
  availableVariables!: VariablesBucket;

  /**
   * Group variables by category to easily choose among them
   *
   * https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_groupby
   */
  get variablesByCategory(): VariablesCategory[] {
    return this.availableVariables.reduce((categories: VariablesCategory[], variable) => {
      const varCategoryLabel = variable.category;
      const category = categories.find(c => c.label === varCategoryLabel);
      if (category !== undefined) {
        category.variables.push(variable);
      } else {
        categories.push({
          label: varCategoryLabel,
          variables: [variable],
        });
      }
      return categories;
    }, []);
  }

  /**
   * Emit the choosen variable
   */
  chooseVariable(variableIdentifier: string) {
    this.$emit('input', variableIdentifier);
  }
}
</script>

<style scoped lang="scss">
@import '../../../../styles/variables';
$grey: #6a6a6a;
$grey-light: #eeedf0;

.widget-variable-list {
  display: flex;
  flex-direction: column;
}

.widget-variable-list__section {
  border-bottom: 1px solid $grey-light;
  padding: 10px 8px;
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}

.widget-variable-list__section-title {
  color: $grey;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5;
  padding: 7px 10px;
}
</style>
