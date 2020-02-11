<template>
  <div class="filter-form" :class="multipleConditionsClass">
    <step-form-header :cancel="cancelEdition" :title="title" :stepName="this.editedStep.name" />
    <div class="filter-form-headers__container">
      <div class="filter-form-header">Values in...</div>
      <div class="filter-form-header">Must...</div>
    </div>
    <ListWidget
      addFieldName="Add condition"
      separatorLabel="and"
      id="filterConditions"
      v-model="conditions"
      :defaultItem="defaultCondition"
      :widget="widgetFilterSimpleCondition"
      :automatic-new-field="false"
      data-path=".condition.and"
      :errors="errors"
    />
    <step-form-buttonbar :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';
import { FilterComboAnd, FilterSimpleCondition, FilterStep, isFilterComboAnd } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import ListWidget from './widgets/List.vue';

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

  get multipleConditionsClass() {
    return {
      'filter-form--multiple-conditions': this.conditions.length > 1,
    };
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
