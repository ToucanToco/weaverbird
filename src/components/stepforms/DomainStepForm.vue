<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <AutocompleteWidget
      class="domainInput"
      v-model="editedStep.domain"
      name="Select domain..."
      :options="domains"
      placeholder="Choose a domain"
    />
    <StepFormButtonbar :errors="errors" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { DomainStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'domain',
  name: 'domain-step-form',
  components: {
    AutocompleteWidget,
  },
})
export default class DomainStepForm extends BaseStepForm<DomainStep> {
  @Prop({
    type: Object,
    default: () => ({
      name: 'domain',
      domain: '',
    }),
  })
  initialStepValue!: DomainStep;

  @VQBModule.State domains!: string[];

  readonly title: string = 'Select a domain';
}
</script>
