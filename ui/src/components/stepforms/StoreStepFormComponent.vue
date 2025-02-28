<template>
  <component
    key="stepForm"
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
import { defineComponent, PropType } from 'vue';
import { mapActions, mapGetters, mapState } from 'pinia';
import type { PipelineStep, PipelineStepName } from '@/lib/steps';
import StepFormsComponents from './index';
import { VariableDelimiters, VariablesBucket } from '@/types';
import { InterpolateFunction, ScopeContext } from '@/lib/templating';
import { ColumnTypeMapping } from '@/lib/dataset';
import { VQBModule } from '@/store';

/*
	StepComponent to use in QueryBuilder context, it uses pinia store to handle selectedColumns 
*/
export default defineComponent({
  name: 'store-step-from-component',
  
  props: {
    name: {
      type: String as PropType<PipelineStepName>,
      required: true
    },
    initialStepValue: {
      type: Object as PropType<Record<string, any> | undefined>,
      default: undefined
    },
    stepFormDefaults: {
      type: Object as PropType<Record<string, any>>,
      default: () => ({})
    },
    backendError: {
      type: String,
      default: undefined
    }
  },
  
  computed: {
    ...mapState(VQBModule, [
      'interpolateFunc',
      'selectedStepIndex',
      'variables',
      'selectedColumns',
      'availableDomains',
      'unjoinableDomains',
      'availableVariables',
      'variableDelimiters',
      'trustedVariableDelimiters'
    ]),
    
    ...mapGetters(VQBModule, [
      'translator',
      'computedActiveStepIndex',
      'columnTypes'
    ]),
    
    isStepCreation() {
      return this.initialStepValue === undefined;
    },
    
    formComponent() {
      return StepFormsComponents[this.name];
    }
  },
  
  methods: {
    ...mapActions(VQBModule, [
      'selectStep',
      'setSelectedColumns',
      'getColumnNamesFromPipeline'
    ]),
    
    back() {
      this.$emit('back');
      const idx = this.isStepCreation ? this.computedActiveStepIndex : this.selectedStepIndex + 1;
      this.selectStep({ index: idx });
    },
    
    formSaved(step: PipelineStep) {
      this.$emit('formSaved', step);
    }
  }
});
</script>
