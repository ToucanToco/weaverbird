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
import { defineComponent, PropType } from 'vue';

import type { AppendStep, PipelineStepName, ReferenceToExternalQuery } from '@/lib/steps';
import { isReferenceToExternalQuery } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

interface DropdownOption {
  label: string;
  trackBy: string | ReferenceToExternalQuery;
  $isDisabled?: boolean;
  tooltip?: string;
}

export default defineComponent({
  name: 'append-step-form',
  components: {
    MultiselectWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<AppendStep>,
      default: () => ({
        name: 'append',
        pipelines: []
      }),
    },
  },
  data(): {
    stepname: PipelineStepName;
    title: string;
    editedStep: AppendStep;
  } {
    return {
      stepname: 'append',
      title: 'Append datasets',
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    pipelines: {
      get(): DropdownOption[] {
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
      },
      set(values: DropdownOption[]) {
        /* istanbul ignore next */
        this.editedStep.pipelines = values.map((v) => v.trackBy);
      },
    },
    options(): DropdownOption[] {
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
    },
  },
});
</script>
