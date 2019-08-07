<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <AutocompleteWidget
      id="domainInput"
      v-model="editedStep.domain"
      name="Select domain..."
      :options="domains"
      placeholder="Choose a domain"
    ></AutocompleteWidget>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { State } from 'vuex-class';
import { DomainStep } from '@/lib/steps';
import { VQBModule } from '@/store';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import { StepFormComponent } from '@/components/formlib';
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
