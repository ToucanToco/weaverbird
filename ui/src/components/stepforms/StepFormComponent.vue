<template>
  <component
    key="stepForm"
    :is="formComponent"
    ref="step"
    :translator="translator"
    :initialStepValue="initialStepValue"
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
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import type { PipelineStep, PipelineStepName, ReferenceToExternalQuery } from '@/lib/steps';
import StepFormsComponents from './index';
import { VariableDelimiters, VariablesBucket } from '@/types';
import { InterpolateFunction, ScopeContext } from '@/lib/templating';
import { ColumnTypeMapping } from '@/lib/dataset';

/*
  StepComponent to use outside of QueryBuilder context, it do not need pinia store to handle selectedColumns 
*/
@Component({
  name: 'step-from-component',
})
export default class StepFormComponent extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  name!: PipelineStepName;

  @Prop({ type: String, default: 'pandas' })
  translator!: string;

  @Prop({
    type: Object,
    required: false,
    default: undefined,
  })
  initialStepValue?: Record<string, any>;

  @Prop({ type: Object, default: undefined })
  stepFormDefaults!: Record<string, any>;

  @Prop({ type: String, default: undefined })
  backendError?: string;

  @Prop({ type: Object, default: () => ({}) })
  columnTypes!: ColumnTypeMapping;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop()
  trustedVariableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, required: false, default: () => ({}) })
  variables!: ScopeContext;

  @Prop({ type: Array, default: () => [] })
  availableDomains!: { name: string; uid: string }[];

  @Prop({ type: Array, default: () => [] })
  unjoinableDomains!: { name: string; uid: string }[];

  @Prop({ type: Function, required: true })
  interpolateFunc!: InterpolateFunction;

  @Prop({ type: Function, required: true })
  getColumnNamesFromPipeline!: (
    pipelineNameOrDomain: string | ReferenceToExternalQuery,
  ) => Promise<string[] | undefined>;

  get isStepCreation() {
    return this.initialStepValue === undefined;
  }

  get formComponent() {
    return StepFormsComponents[this.name];
  }

  back() {
    this.$emit('back');
  }

  formSaved(step: PipelineStep) {
    this.$emit('formSaved', step);
  }

  selectedColumns: string[] = [];

  setSelectedColumns({ column }: { column: string | undefined }) {
    if (!!column && column !== this.selectedColumns[0]) {
      this.selectedColumns = [column];
    }
  }
}
</script>
