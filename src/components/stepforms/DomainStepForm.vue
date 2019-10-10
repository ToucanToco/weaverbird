<template>
  <div>
    <step-form-title :title="title"/>
    <AutocompleteWidget
      id="domainInput"
      v-model="editedStep.domain"
      name="Select domain..."
      :options="domains"
      placeholder="Choose a domain"
    />
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"/>
  </div>
</template>

<script lang="ts">
import { VQBModule } from '@/store';
import { Prop } from 'vue-property-decorator';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { StepFormComponent } from '@/components/formlib';
import BaseStepForm from './StepForm.vue';
import { DomainStep } from '@/lib/steps';

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
