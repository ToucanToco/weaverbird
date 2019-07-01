<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="domainInput"
      v-model="editedStep.domain"
      name="Select domain..."
      :options="domains"
      placeholder="Choose a domain"
    ></WidgetAutocomplete>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import domainSchema from '@/assets/schemas/domain-step__schema.json';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import { State } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';
import BaseStepForm from './StepForm.vue';
import { DomainStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'domain',
  name: 'domain-step-form',
  components: {
    WidgetAutocomplete,
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

  @State domains!: string[];

  readonly title: string = 'Select a domain';

  editedStepModel = domainSchema;
}
</script>
