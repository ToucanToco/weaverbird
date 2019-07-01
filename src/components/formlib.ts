/**
 * This module exposes step form helpers.
 */
import _ from 'lodash';
import Vue, { VueConstructor } from 'vue';
import { Component } from 'vue-property-decorator';
import { PipelineStepName } from '@/lib/steps';

export type StepMapper = { [K in PipelineStepName]?: VueConstructor<Vue> };

/**
 * This will contain the mapping *step name* → *corresponding form class*
 * for each available step form.
 */
export const STEPFORM_REGISTRY: StepMapper = {};

interface StepFormConfig {
  vqbstep: PipelineStepName;
  [prop: string]: any;
}

/**
 * `StepFormComponent` is a thin wrapper around `vue-property-decorator.Component`
 * that registers a form component class for a given step in the `STEPFORM_REGISTRY`
 * registry.
 *
 * The step name should be specified with the `vqbstep` configuration parameter.
 *
 * @param config the component configuration. Its value is directly passed to
 * the `vue-property-decorator.Component` decorator.
 */
export function StepFormComponent(
  config: StepFormConfig,
  registry: StepMapper = STEPFORM_REGISTRY,
) {
  return function(target: any) {
    if (config.vqbstep in registry) {
      throw new Error(`a form is already resgistered for step ${config.vqbstep}`);
    }
    target.prototype.stepname = config.vqbstep;
    const decorated = Component(_.omit(config, 'vqbstep'))(target);
    registry[config.vqbstep] = decorated;
    // register component globally. This is OK, we know that this component has
    // to be available and used at some point. Furthermore, we won't have to import
    // manually each step form in the hosting component.
    Vue.component(`${config.vqbstep}-step-form`, decorated);
    return decorated;
  };
}
