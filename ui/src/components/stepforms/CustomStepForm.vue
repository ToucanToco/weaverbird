<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <label v-if="name">{{ name }}</label>
    <CodeEditorWidget
      v-model="editedStep.query"
      placeholder="Write your custom mongo here"
      :errors="errors"
      data-path=".query"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { CustomStep, PipelineStepName } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';

import BaseStepForm from './StepForm.vue';
import CodeEditorWidget from './widgets/CodeEditorWidget.vue';

export default defineComponent({
  name: 'custom-step-form',
  components: { CodeEditorWidget },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<CustomStep>,
      default: () => ({ name: 'custom', query: '[{"$match": {"domain": "test"}}]' }),
    },
  },
  data() {
    return {
      stepname: 'custom' as PipelineStepName,
      title: 'Custom step',
    };
  },
  computed: {
    name() {
      return `Write a custom ${getTranslator(this.translator).constructor.label} query`;
    },
  },
  methods: {
    validate() {
      const errors = this.$$super.validate();
      if (errors !== null) {
        return errors;
      }
      const translatorErrors = getTranslator(this.translator).validate({ ...this.editedStep });
      return translatorErrors;
    },
  },
});
</script>
