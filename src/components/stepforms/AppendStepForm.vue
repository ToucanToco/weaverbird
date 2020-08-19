<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <MultiselectWidget
      class="pipelinesInput"
      v-model="pipelines"
      name="Select datasets to append:"
      :options="options"
      placeholder="Select datasets"
      data-path=".pipelines"
      :errors="errors"
      track-by="trackBy"
      label="label"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import { AppendStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'append',
  name: 'append-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class AppendStepForm extends BaseStepForm<AppendStep> {
  @Prop({ type: Object, default: () => ({ name: 'append', pipelines: [] }) })
  initialStepValue!: AppendStep;

  @VQBModule.Getter referencingPipelines!: string[];
  @VQBModule.Getter availablePipelines!: string[];
  @VQBModule.State domains!: string[];

  readonly title: string = 'Append datasets';

  get pipelines(): object[] {
    return this.editedStep.pipelines.map(pipeline => ({
      label: pipeline,
      trackBy: pipeline,
    }));
  }

  set pipelines(values: object[]) {
    /* istanbul ignore next */
    this.editedStep.pipelines = values.map(v => v.label);
  }

  get options(): object[] {
    return [...this.availablePipelines, ...this.domains].map(name => {
      const option = { label: name, trackBy: name };
      if (this.referencingPipelines.includes(name)) {
        option['$isDisabled'] = true;
        option[
          'tooltip'
        ] = `Circular reference: you cannot combine ${name} because it references the current dataset.`;
      }
      return option;
    });
  }
}
</script>
