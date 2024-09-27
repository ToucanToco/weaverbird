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
import Vue from 'vue';
import { Component, Prop } from 'vue-property-decorator';
import type { PipelineStep, PipelineStepName } from '@/lib/steps';
import StepFormsComponents from './index';
import { VariableDelimiters, VariablesBucket } from '@/types';
import { InterpolateFunction, ScopeContext } from '@/lib/templating';
import { ColumnTypeMapping } from '@/lib/dataset';
import { Action, Getter, State } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

/*
	StepComponent to use in QueryBuilder context, it uses pinia store to handle selectedColumns 
*/
@Component({
  name: 'store-step-from-component',
})
export default class StoreStepFormComponent extends Vue {
  @Prop({ type: String, required: true })
  name!: PipelineStepName;

  @Prop({ type: Object, default: undefined })
  initialStepValue?: Record<string, any>;

  @Prop({ type: Object, default: undefined })
  stepFormDefaults!: Record<string, any>;

  @Prop({ type: String, default: undefined })
  backendError?: string;

  @Action(VQBModule) selectStep!: VQBActions['selectStep'];
  @Action(VQBModule) setSelectedColumns!: VQBActions['setSelectedColumns'];
  @Action(VQBModule) getColumnNamesFromPipeline!: VQBActions['getColumnNamesFromPipeline'];
  @State(VQBModule) interpolateFunc!: InterpolateFunction;

  @State(VQBModule) selectedStepIndex!: number;
  @State(VQBModule) variables!: ScopeContext;
  @Getter(VQBModule) translator!: string;
  @Getter(VQBModule) computedActiveStepIndex!: number;
  @State(VQBModule) selectedColumns!: string[];
  @State(VQBModule) availableDomains!: { name: string; uid: string }[];
  @State(VQBModule) unjoinableDomains!: { name: string; uid: string }[];
  @Getter(VQBModule) columnTypes!: ColumnTypeMapping;
  @State(VQBModule) availableVariables?: VariablesBucket;
  @State(VQBModule) variableDelimiters?: VariableDelimiters;
  @State(VQBModule) trustedVariableDelimiters?: VariableDelimiters;

  get isStepCreation() {
    return this.initialStepValue === undefined;
  }

  get formComponent() {
    return StepFormsComponents[this.name];
  }

  back() {
    this.$emit('back');
    const idx = this.isStepCreation ? this.computedActiveStepIndex : this.selectedStepIndex + 1;
    this.selectStep({ index: idx });
  }

  formSaved(step: PipelineStep) {
    this.$emit('formSaved', step);
  }
}
</script>
