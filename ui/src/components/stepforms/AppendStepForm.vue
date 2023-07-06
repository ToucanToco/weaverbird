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
      with-example
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import type { AppendStep, PipelineStepName, ReferenceToExternalQuery } from '@/lib/steps';
import { isReferenceToExternalQuery } from '@/lib/steps';
import { State } from 'pinia-class';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

interface DropdownOption {
  label: string;
  trackBy: string | ReferenceToExternalQuery;
  $isDisabled?: boolean;
  tooltip?: string;
}

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

  @State(VQBModule) availableDomains!: { name: string; uid: string }[];
  @State(VQBModule) unjoinableDomains!: { name: string; uid: string }[];

  readonly title: string = 'Append datasets';

  get pipelines(): DropdownOption[] {
    return this.editedStep.pipelines.map((pipeline) => {
      if (isReferenceToExternalQuery(pipeline)) {
        return {
          label: this.availableDomains.find((d) => d.uid === pipeline.uid)?.name ?? pipeline.uid,
          trackBy: pipeline,
        };
      } else {
        return {
          label: pipeline as string,
          trackBy: pipeline as string,
        };
      }
    });
  }

  set pipelines(values: DropdownOption[]) {
    /* istanbul ignore next */
    this.editedStep.pipelines = values.map((v) => v.trackBy);
  }

  get options(): DropdownOption[] {
    return this.availableDomains.map((d) => {
      const isDisabled = !!this.unjoinableDomains.find((domain) => domain.uid === d.uid);
      return {
        label: d.name,
        trackBy: { type: 'ref', uid: d.uid },
        ...(isDisabled && {
          disabled: true,
          tooltip: 'This dataset cannot be combined with the actual one',
        }),
      };
    });
  }
}
</script>
