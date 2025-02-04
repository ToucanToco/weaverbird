<!-- Unused, only supported as first step of a pipeline -->

<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <label>
      Please write you SQL query by referring to the result of the previous step. Refer to the
      previous step using the <strong>##PREVIOUS_STEP##</strong> keyword
    </label>
    <CodeEditorWidget
      v-model="editedStep.query"
      placeholder="Write your custom Sql here"
      :errors="errors"
      data-path=".query"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { CustomSqlStep, PipelineStepName } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';

import BaseStepForm from './StepForm.vue';
import CodeEditorWidget from './widgets/CodeEditorWidget.vue';

export default defineComponent({
  name: 'custom-sql-step-form',

  components: {
    CodeEditorWidget
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<Partial<CustomSqlStep>>,
      default: (): Partial<CustomSqlStep> => ({
        name: 'customsql',
        query: 'SELECT * FROM ##PREVIOUS_STEP##'
      }),
    },
  },

  data(): {
    stepname: PipelineStepName;
    title: string;
    editedStep: CustomSqlStep;
  } {
    return {
      stepname: 'customsql',
      title: 'Custom Sql step',
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },

  methods: {
    validate() {
      const errors = this.$$super.validate();
      if (errors !== null) {
        return errors;
      }
      return getTranslator('snowflake').validate({ ...this.editedStep });
    },
  },
});
</script>
