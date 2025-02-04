<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ListWidget
      addFieldName="Add new column"
      class="totals"
      name="Columns to compute total rows in:"
      v-model="totalDimensions"
      :defaultItem="defaultTotalDimensions"
      :widget="totalDimensionsWidget"
      :automatic-new-field="false"
      data-path=".totalDimensions"
      :errors="errors"
      unstyled-items
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <ListWidget
      class="aggregationsInput"
      addFieldName="Add aggregation"
      name="Columns to aggregate:"
      v-model="aggregations"
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <MultiselectWidget
      class="groupsInput"
      v-model="editedStep.groups"
      name="(Optional) Group by:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.groups[editedStep.groups.length - 1] })"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
      :allowCustom="true"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { AddTotalRowsStep, Aggregation, PipelineStepName, TotalDimension } from '@/lib/steps';
import { setAggregationsNewColumnsInStep } from '@/lib/helpers';
import BaseStepForm from './StepForm.vue';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';
import TotalDimensionsWidget from '@/components/stepforms/widgets/TotalDimensions.vue';

export default defineComponent({
  name: 'totals-step-form',
  components: {
    ListWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<AddTotalRowsStep>,
      default: () => ({
        name: 'totals',
        totalDimensions: [],
        aggregations: []
      }),
    },
  },
  data(): {
    stepname: PipelineStepName;
    title: string;
    totalDimensionsWidget: typeof TotalDimensionsWidget;
    widgetAggregation: typeof AggregationWidget;
    editedStep: AddTotalRowsStep;
  } {
    return {
      stepname: 'totals',
      title: 'Add Total Rows',
      totalDimensionsWidget: TotalDimensionsWidget,
      widgetAggregation: AggregationWidget,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    defaultAggregation(): Aggregation {
      const agg: Aggregation = {
        columns: [],
        newcolumns: [],
        aggfunction: 'sum',
      };
      return agg;
    },
    aggregations: {
      get(): Aggregation[] {
        return this.editedStep.aggregations;
      },
      set(newval: Aggregation[]) {
        this.editedStep.aggregations = [...newval];
      },
    },
    defaultTotalDimensions(): TotalDimension {
      return { totalColumn: '', totalRowsLabel: '' };
    },
    totalDimensions: {
      get(): TotalDimension[] {
        if (this.editedStep.totalDimensions.length) {
          return this.editedStep.totalDimensions;
        } else {
          return [{ totalColumn: '', totalRowsLabel: '' }];
        }
      },
      set(newval: TotalDimension[]) {
        this.editedStep.totalDimensions = [...newval];
      },
    },
  },
  methods: {
    async submit() {
      setAggregationsNewColumnsInStep(this.editedStep);
      await this.$nextTick();
      this.$$super.submit();
    },
  },
});
</script>
