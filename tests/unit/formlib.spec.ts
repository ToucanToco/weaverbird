import Vue from 'vue';

import { StepFormComponent, StepMapper } from '@/components/formlib';
import { PipelineStepName } from '@/lib/steps';

function registerStep(registry: StepMapper, vqbstep: PipelineStepName) {
  @StepFormComponent({ vqbstep }, registry)
  class StepForm extends Vue {}
  return StepForm;
}

describe('StepForm registration', () => {
  it('should register', () => {
    const registry: StepMapper = {};
    const form1 = registerStep(registry, 'pivot');
    const form2 = registerStep(registry, 'rename');
    expect(registry).toEqual({
      pivot: form1,
      rename: form2,
    });
  });

  it('should fail to register a step form twice', () => {
    const registry: StepMapper = {};
    const form = registerStep(registry, 'pivot');
    expect(registry).toEqual({
      pivot: form,
    });
    expect(() => registerStep(registry, 'pivot')).toThrow();
  });
});
