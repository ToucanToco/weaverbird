<template>
  <div class="filter-form">
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ConditionsEditor
      :conditions-tree="conditionsTree"
      @conditionsTreeUpdated="updateConditionsTree"
    >
      <template v-slot:default="slotProps">
        <FilterSimpleConditionWidget
          :value="slotProps.condition"
          @input="slotProps.updateCondition"
          :data-path="slotProps.dataPath"
          :errors="errors"
        />
      </template>
    </ConditionsEditor>
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop, Watch } from 'vue-property-decorator';

import ConditionsEditor from '@/components/ConditionsEditor/ConditionsEditor.vue';
import { StepFormComponent } from '@/components/formlib';
import {
  buildConditionsEditorTree,
  buildFilterStepTree,
  castFilterStepTreeValue,
} from '@/components/stepforms/convert-filter-step-tree.ts';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { FilterSimpleCondition, FilterStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import { AbstractFilterTree } from '../ConditionsEditor/tree-types';
import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    ConditionsEditor,
    FilterSimpleConditionWidget,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  @Prop({
    type: Object,
    default: () => ({
      name: 'filter',
      condition: { column: '', value: '', operator: 'eq' },
    }),
  })
  initialStepValue!: FilterStep;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Filter';
  widgetFilterSimpleCondition = FilterSimpleConditionWidget;

  mounted() {
    // On creation, if a column is selected, use it to set "column" property of
    // the filter step
    if (this.isStepCreation && this.selectedColumns[0]) {
      let condition;
      if (this.stepFormDefaults && this.stepFormDefaults.condition) {
        condition = this.stepFormDefaults.condition;
      } else {
        condition = { column: this.selectedColumns[0], value: '', operator: 'eq' };
      }
      this.editedStep = {
        name: 'filter' as 'filter',
        condition: condition as FilterSimpleCondition,
      };
    } else {
      // Otherwise, fallback on the default initial value
      this.editedStep = {
        name: 'filter' as 'filter',
        condition: {
          ...(this.stepFormDefaults ? this.stepFormDefaults.condition : {}),
          ...this.initialStepValue.condition,
        },
      };
    }
  }

  get conditionsTree() {
    return buildConditionsEditorTree(this.editedStep.condition);
  }

  submit() {
    this.editedStep.condition = castFilterStepTreeValue(
      this.editedStep.condition,
      this.columnTypes,
    );
    this.$$super.submit();
  }

  updateConditionsTree(newConditionsTree: AbstractFilterTree) {
    // second arg specify if it's the root or not (because it's a recursive function)
    const newFilterStepTree = buildFilterStepTree(newConditionsTree, true);
    this.editedStep = newFilterStepTree;
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
