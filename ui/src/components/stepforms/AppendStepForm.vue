<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import type { AppendStep, PipelineStepName } from '@/lib/steps';
import { State } from 'pinia-class';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'append-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class AppendStepForm extends BaseStepForm<AppendStep> {
  stepname: PipelineStepName = 'append';

  @Prop({ type: Object, default: () => ({ name: 'append', pipelines: [] }) })
  declare initialStepValue: AppendStep;

  @State(VQBModule) availableDomains!: {name: string; uid: string}[];

  readonly title: string = 'Append datasets';

  get pipelines(): object[] {
    return this.editedStep.pipelines.map((pipeline) => ({
      label: pipeline,
      trackBy: pipeline,
    }));
  }

  set pipelines(values: object[]) {
    /* istanbul ignore next */
    this.editedStep.pipelines = values.map((v) => v.label);
  }

  get options(): object[] {
    // TOFIX: use reference to uid in next commit
    return this.availableDomains.map((d) => ({ label: d.name, trackBy: d.name }));
  }
}
</script>
