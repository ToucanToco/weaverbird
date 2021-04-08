<template>
  <div class="filter-form">
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <div class="filter-form__info">Filter rows matching this condition:</div>
    <FilterEditor
      :filter-tree="this.editedStep.condition"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :columnTypes="columnTypes"
      @filterTreeUpdated="updateFilterTree"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import FilterEditor from '@/components/FilterEditor.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { FilterCondition, FilterSimpleCondition, FilterStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'filter-step-form',
  components: {
    FilterEditor,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  stepname: PipelineStepName = 'filter';

  @Prop({
    type: Object,
    default: () => ({
      name: 'filter',
      condition: { column: '', value: '', operator: 'eq' },
    }),
  })
  initialStepValue!: FilterStep;

  @VQBModule.State availableVariables?: VariablesBucket;
  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Filter';

  mounted() {
    // On creation, if a column is selected, use it to set "column" property of
    // the filter step
    if (this.isStepCreation && this.selectedColumns[0]) {
      const condition = { column: this.selectedColumns[0], value: '', operator: 'eq' };
      this.editedStep = {
        name: 'filter' as 'filter',
        condition: condition as FilterSimpleCondition,
      };
    } else {
      // Otherwise, fallback on the default initial value
      this.editedStep = {
        name: 'filter' as 'filter',
        condition: { ...this.initialStepValue.condition },
      };
    }
  }

  submit() {
    this.$$super.submit();
  }

  updateFilterTree(newFilterTree: FilterCondition) {
    this.editedStep = {
      name: 'filter',
      condition: newFilterTree,
    };
  }
}
</script>

<style lang="scss" scoped>
.filter-form-headers__container {
  display: flex;
  width: 66%;
}

.filter-form-header {
  font-size: 14px;
  margin-left: 10px;
  width: 50%;
}
</style>
<style lang="scss">
.filter-form {
  .widget-list__body .widget-list__icon {
    top: 5px;
  }
  .widget-list__component-sep {
    left: 0;
    position: absolute;
    top: 10px;
  }
}
.filter-form--multiple-conditions {
  .filter-form-headers__container {
    margin-left: 30px;
  }
  .widget-list__component {
    margin-left: 30px;
  }
}
</style>
