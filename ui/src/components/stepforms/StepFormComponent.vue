<template>
  <component
    :key="`${name}__${selectedColumn}`"
    :is="formComponent"
    ref="step"
    :translator="translator"
    :initialStepValue="initialStepValue"
    :stepFormDefaults="stepFormDefaults"
    :isStepCreation="isStepCreation"
    :columnTypes="columnTypes"
    :backendError="backendError"
    :availableVariables="availableVariables"
    :variableDelimiters="variableDelimiters"
    :trustedVariableDelimiters="trustedVariableDelimiters"
    :variables="variables"
    :availableDomains="availableDomains"
    :unjoinableDomains="unjoinableDomains"
    :selectedColumns="selectedColumns"
    :interpolateFunc="interpolateFunc"
    :getColumnNamesFromPipeline="getColumnNamesFromPipeline"
    @back="back"
    @formSaved="formSaved"
    @setSelectedColumns="setSelectedColumns"
  />
</template>
<script lang="ts">
import { defineComponent, PropType, ref, computed, watch } from 'vue';

import type { PipelineStep, PipelineStepName, ReferenceToExternalQuery } from '@/lib/steps';
import StepFormsComponents from './index';
import { VariableDelimiters, VariablesBucket } from '@/types';
import { InterpolateFunction, ScopeContext } from '@/lib/templating';
import { ColumnTypeMapping } from '@/lib/dataset';

/*
  StepComponent to use outside of QueryBuilder context, it do not need pinia store to handle selectedColumns
*/
export default defineComponent({
  name: 'step-from-component',

  props: {
    name: {
      type: String as PropType<PipelineStepName>,
      required: true,
    },
    translator: {
      type: String as PropType<string>,
      default: 'pandas',
    },
    initialStepValue: {
      type: Object as PropType<Partial<PipelineStep>>,
      required: false,
      default: undefined,
    },
    stepFormDefaults: {
      type: Object as PropType<Partial<PipelineStep>>,
      default: undefined,
    },
    backendError: {
      type: String as PropType<string>,
      default: undefined,
    },
    columnTypes: {
      type: Object as PropType<ColumnTypeMapping>,
      default: () => ({}),
    },
    availableVariables: {
      type: Object as PropType<VariablesBucket>,
      default: undefined,
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
      default: undefined,
    },
    variables: {
      type: Object as PropType<ScopeContext>,
      default: () => ({}),
    },
    availableDomains: {
      type: Array as PropType<{ name: string; uid: string }[]>,
      default: () => [],
    },
    unjoinableDomains: {
      type: Array as PropType<{ name: string; uid: string }[]>,
      default: () => [],
    },
    interpolateFunc: {
      type: Function as PropType<InterpolateFunction>,
      required: true,
    },
    getColumnNamesFromPipeline: {
      type: Function as PropType<
        (pipelineNameOrDomain: string | ReferenceToExternalQuery) => Promise<string[] | undefined>
      >,
      required: true,
    },
    selectedColumn: {
      type: String as PropType<string>,
      default: undefined,
    },
  },

  setup(props, { emit }) {
    const selectedColumns = ref<string[]>(props.selectedColumn ? [props.selectedColumn] : []);

    const isStepCreation = computed(() => props.initialStepValue === undefined);

    const formComponent = computed(() => StepFormsComponents[props.name]);

    const back = () => {
      emit('back');
    };

    const formSaved = (step: PipelineStep) => {
      emit('formSaved', step);
    };

    const setSelectedColumns = ({ column }: { column: string | undefined }) => {
      if (!!column && column !== selectedColumns.value[0]) {
        selectedColumns.value = [column];
      }
    };

    watch(
      () => props.selectedColumn,
      () => {
        setSelectedColumns({ column: props.selectedColumn });
      },
    );

    return {
      selectedColumns,
      isStepCreation,
      formComponent,
      back,
      formSaved,
      setSelectedColumns,
    };
  },
});
</script>
