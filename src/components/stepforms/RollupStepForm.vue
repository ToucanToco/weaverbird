<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="hierarchyColumnsInput"
      v-model="editedStep.hierarchy"
      name="Hierarchical columns (from top to bottom level):"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.hierarchy[editedStep.hierarchy.length - 1] })"
      placeholder="Add columns"
      data-path=".hierarchy"
      :errors="errors"
    />
    <ListWidget
      class="aggregationsInput"
      addFieldName="Add aggregation"
      name="(Optional) Columns to aggregate:"
      v-model="aggregations"
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="groupby"
      name="(Optional) Group rollup by:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupby"
      :errors="errors"
    />
    <InputTextWidget
      class="labelColumnInput"
      v-model="editedStep.labelCol"
      name="(Optional) Label column name to be created:"
      placeholder="label"
      data-path=".labelCol"
      :errors="errors"
    />
    <InputTextWidget
      class="levelColumnInput"
      v-model="editedStep.levelCol"
      name="(Optional) Level column name to be created:"
      placeholder="level"
      data-path=".levelCol"
      :errors="errors"
    />
    <InputTextWidget
      class="parentColumnInput"
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { setAggregationsNewColumnsInStep } from '@/lib/helpers';
import { Aggregation, PipelineStepName, RollupStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'rollup-step-form',
  components: {
    InputTextWidget,
    ListWidget,
    MultiselectWidget,
  },
})
export default class RollupStepForm extends BaseStepForm<RollupStep> {
  stepname: PipelineStepName = 'rollup';

  @Prop({
    type: Object,
    default: () => ({ name: 'rollup', hierarchy: [], aggregations: [] }),
  })
  initialStepValue!: RollupStep;

  readonly title: string = 'Hierarchical rollup';
  widgetAggregation = AggregationWidget;

  /** Overload the definition of editedStep in BaseStepForm, to manage retrocompatibility:
   *   column and newcolumn (simple strings parameters) are deprecated and replaced by
   *   columns and newcolumns (list if strings)
   */
  editedStep: RollupStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    aggregations: this.initialStepValue.aggregations.map(x => ({
      ...x,
      columns: x.column ? [x.column] : x.columns,
      newcolumns: x.newcolumn ? [x.newcolumn] : x.newcolumns,
      column: undefined,
      newcolumn: undefined,
    })),
  };

  get defaultAggregation() {
    const agg: Aggregation = {
      columns: [],
      newcolumns: [],
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

  get groupby() {
    return this.editedStep.groupby ?? [];
  }

  set groupby(groupby: any[]) {
    this.editedStep.groupby = groupby.length ? groupby : undefined;
  }

  submit() {
    setAggregationsNewColumnsInStep(this.editedStep);
    this.$$super.submit();
  }
}
</script>
