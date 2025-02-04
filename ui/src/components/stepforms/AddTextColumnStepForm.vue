<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column:"
      placeholder="Enter a new column name"
      data-path=".newColumn"
      :errors="errors"
      :warning="duplicateColumnName"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <InputTextWidget
      class="textInput"
      v-model="editedStep.text"
      name="Enter a text:"
      placeholder
      data-path=".text"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { AddTextColumnStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'text-step-form',

  components: {
    InputTextWidget,
  },

  extends: BaseStepForm,

  props: {
    initialStepValue: {
      type: Object as PropType<AddTextColumnStep>,
      default: (): AddTextColumnStep => ({
        name: 'text',
        newColumn: '',
        text: ''
      }),
    },
  },

  data(): {
    stepname: PipelineStepName;
    title: string;
    editedStep: AddTextColumnStep;
  } {
    return {
      stepname: 'text',
      title: 'Add Text Column',
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },

  computed: {
    duplicateColumnName(): string | null {
      if (this.columnNames.includes(this.editedStep.newColumn)) {
        return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
  },

  methods: {
    submit() {
      this.$$super.submit();
      if (this.errors === null) {
        this.setSelectedColumns({ column: this.editedStep.newColumn });
      }
    },
  },
});
</script>
