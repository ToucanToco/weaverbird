<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <MultiselectWidget
      id="hierarchyColumnsInput"
      v-model="editedStep.hierarchy"
      name="Hierarchical columns (from top to bottom level):"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.hierarchy[editedStep.hierarchy.length - 1] })"
      placeholder="Add columns"
      data-path=".hierarchy"
      :errors="errors"
    />
    <ListWidget
      id="aggregationsInput"
      addFieldName="Add aggregation"
      name="Columns to aggregate:"
      v-model="aggregations"
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
    />
    <MultiselectWidget
      id="groupbyColumnsInput"
      v-model="editedStep.groupby"
      name="(Optional) Group rollup by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.groupby[editedStep.groupby.length - 1] })"
      placeholder="Add columns"
      data-path=".groupby"
      :errors="errors"
    />
    <InputTextWidget
      id="labelColumnInput"
      v-model="editedStep.labelCol"
      name="(Optional) Label column name to be created:"
      placeholder="label"
      data-path=".labelCol"
      :errors="errors"
    />
    <InputTextWidget
      id="levelColumnInput"
      v-model="editedStep.levelCol"
      name="(Optional) Level column name to be created:"
      placeholder="level"
      data-path=".levelCol"
      :errors="errors"
    />
    <InputTextWidget
      id="parentColumnInput"
      v-model="editedStep.parentLabelCol"
      name="(Optional) Parent column name to be created:"
      placeholder="parent"
      data-path=".parentLabelCol"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { AggFunctionStep, RollupStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'rollup',
  name: 'rollup-step-form',
  components: {
    InputTextWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class RollupStepForm extends BaseStepForm<RollupStep> {
  @Prop({ type: Object, default: () => ({ name: 'rollup', hierarchy: [], aggregations: [] }) })
  initialStepValue!: RollupStep;

  readonly title: string = 'Hierarchical rollup';
  widgetAggregation = AggregationWidget;

  get defaultAggregation() {
    const agg: AggFunctionStep = {
      column: '',
      newcolumn: '',
      aggfunction: 'sum',
    };
    return agg;
  }

  get aggregations() {
    if (this.editedStep.aggregations.length) {
      return this.editedStep.aggregations;
    } else {
      return [this.defaultAggregation];
    }
  }

  set aggregations(newval) {
    this.editedStep.aggregations = [...newval];
  }

  submit() {
    /**
     * If different aggregations have to be performed on the same column, add a suffix
     * to the automatically generated newcolumn name
     */
    const newcolumnOccurences: { [prop: string]: number } = {};
    for (const agg of this.editedStep.aggregations) {
      agg.newcolumn = agg.column;
      newcolumnOccurences[agg.newcolumn] = (newcolumnOccurences[agg.newcolumn] || 0) + 1;
    }
    for (const agg of this.editedStep.aggregations) {
      if (newcolumnOccurences[agg.newcolumn] > 1) {
        agg.newcolumn = `${agg.newcolumn}-${agg.aggfunction}`;
      }
    }
    this.$$super.submit();
  }
}
</script>
