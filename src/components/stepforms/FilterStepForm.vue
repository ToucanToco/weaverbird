<template>
  <div class="filter-form">
    <step-form-title :title="title"></step-form-title>
    <div class="filter-form-headers__container">
      <div class="filter-form-header">Values in...</div>
      <div class="filter-form-header">Must...</div>
    </div>
    <ListWidget
      addFieldName="Add condition"
      separatorLabel="And"
      id="filterConditions"
      v-model="conditions"
      :defaultItem="defaultCondition"
      :widget="widgetFilterSimpleCondition"
      :automatic-new-field="false"
      data-path=".condition.and"
      :errors="errors"
    ></ListWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { VQBModule } from '@/store';
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import ListWidget from './widgets/List.vue';
import BaseStepForm from './StepForm.vue';
import { FilterStep, FilterComboAnd, isFilterComboAnd } from '@/lib/steps';
import { FilterSimpleCondition } from '@/lib/steps';
import { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';

@StepFormComponent({
  vqbstep: 'filter',
  name: 'filter-step-form',
  components: {
    FilterSimpleConditionWidget,
    ListWidget,
  },
})
export default class FilterStepForm extends BaseStepForm<FilterStep> {
  @Prop({
    type: Object,
    default: () => ({
      name: 'filter',
      condition: { and: [{ column: '', value: '', operator: 'eq' }] },
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
      const condition = { and: [{ column: this.selectedColumns[0], value: '', operator: 'eq' }] };
      this.editedStep = {
        name: 'filter' as 'filter',
        condition: condition as FilterComboAnd,
      };
    } else {
      // Otherwise, fallback on the default initial value
      this.editedStep = {
        name: 'filter' as 'filter',
        condition: { ...this.initialStepValue.condition },
      };
    }
  }

  get defaultCondition() {
    const cond: FilterSimpleCondition = { column: '', value: '', operator: 'eq' };
    return cond;
  }

  get conditions() {
    if (isFilterComboAnd(this.editedStep.condition) && this.editedStep.condition.and.length) {
      return this.editedStep.condition.and;
    } else {
      return [this.defaultCondition];
    }
  }

  set conditions(newval) {
    if (isFilterComboAnd(this.editedStep.condition)) {
      this.editedStep.condition.and = [...newval];
    }
  }

  submit() {
    if (isFilterComboAnd(this.editedStep.condition)) {
      for (const cond of this.editedStep.condition.and as FilterSimpleCondition[]) {
        const type = this.columnTypes[cond.column];
        if (type !== undefined) {
          if (Array.isArray(cond.value)) {
            cond.value = cond.value.map(v => castFromString(v, type));
          } else {
            cond.value = castFromString(cond.value, type);
          }
        }
      }
    }
    this.$$super.submit();
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
.filter-form .widget-list__body .widget-list__icon {
  top: 5px;
}
</style>
