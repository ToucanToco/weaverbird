<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
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
import { defineComponent, PropType } from 'vue';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import type { DomainStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'domain-step-form',
  components: {
    AutocompleteWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<DomainStep>,
      default: (): DomainStep => ({
        name: 'domain',
        domain: '',
      }),
    },
  },
  data() {
    return {
      stepname: 'domain' as PipelineStepName,
      title: 'Select a dataset',
    };
  },
  computed: {
    availableDatasetNames(): string[] {
      return this.availableDomains.map((d) => d.name);
    },
  },
});
</script>
