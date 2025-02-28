<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.groups"
      name="Group rows by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groups"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <ListWidget
      v-model="editedStep.aggregations"
      addFieldName="Add aggregation"
      class="toremove"
      name="And aggregate..."
      :defaultItem="defaultAggregation"
      :widget="widgetAggregation"
      :automatic-new-field="false"
      data-path=".aggregations"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <CheckboxWidget
      class="keepNullsCheckbox"
      label="Include null values in results"
      v-model="editedStep.includeNulls"
    />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import { defineComponent, PropType } from 'vue';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import type { Aggregation, DissolveStep, PipelineStepName } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import { suffixAggregationsColumns } from './utils';
import AggregationWidget from './widgets/Aggregation.vue';
import ListWidget from './widgets/List.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

export default defineComponent({
  name: 'dissolve-step-form',
  components: {
    CheckboxWidget,
    ListWidget,
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<Partial<DissolveStep>>,
      default: (): Partial<DissolveStep> => ({
        name: 'dissolve',
        groups: [],
        includeNulls: false,
        aggregations: [],
      }),
    },
  },
  data() {
    return {
      stepname: 'dissolve' as PipelineStepName,
      title: 'Dissolve' as string,
      widgetAggregation: AggregationWidget,
    };
  },
  computed: {
    defaultAggregation(): Aggregation {
      return {
        columns: [],
        newcolumns: [],
        aggfunction: 'sum',
      };
    },
  },
  methods: {
    submit() {
      suffixAggregationsColumns(this.editedStep);
      this.$$super.submit();
    },
  },
});
</script>
