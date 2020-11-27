<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
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

import { AppendStep, PipelineStepName } from '../../lib/steps';
import { VQBModule } from '../../store';
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
  initialStepValue!: AppendStep;

  @VQBModule.Getter referencingPipelines!: string[];
  @VQBModule.Getter availableDatasetNames!: string[];

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
    return this.availableDatasetNames.map(name => {
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
