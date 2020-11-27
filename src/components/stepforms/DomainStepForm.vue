<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <AutocompleteWidget
      class="domainInput"
      v-model="editedStep.domain"
      name="Select a dataset to start..."
      :options="availableDatasetNames"
      placeholder="Choose a dataset"
    />
    <StepFormButtonbar :errors="errors" />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { DomainStep, PipelineStepName } from '../../lib/steps';
import { VQBModule } from '../../store';
import AutocompleteWidget from '..//stepforms/widgets/Autocomplete.vue';
import BaseStepForm from './StepForm.vue';

@Component({
  name: 'domain-step-form',
  components: {
    AutocompleteWidget,
  },
})
export default class DomainStepForm extends BaseStepForm<DomainStep> {
  stepname: PipelineStepName = 'domain';

  @Prop({
    type: Object,
    default: () => ({
      name: 'domain',
      domain: '',
    }),
  })
  initialStepValue!: DomainStep;

  @VQBModule.Getter availableDatasetNames!: string[];

  readonly title: string = 'Select a dataset';
}
</script>
