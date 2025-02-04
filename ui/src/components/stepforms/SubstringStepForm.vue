<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="column"
      v-model="editedStep.column"
      name="Extract a substring from..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="startIndex"
      v-model.number="editedStep.startIndex"
      type="number"
      name="Substring starts at character position:"
      placeholder="Enter an integer"
      data-path=".startIndex"
      :errors="errors"
    />
    <InputTextWidget
      class="endIndex"
      v-model.number="editedStep.endIndex"
      type="number"
      name="And ends at character position:"
      placeholder="Enter an integer"
      data-path=".endIndex"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="(Optional) New column name:"
      :placeholder="`${editedStep.column}_SUBSTR`"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import BaseStepForm from './StepForm.vue';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { PipelineStepName, SubstringStep } from '@/lib/steps';

export default defineComponent({
  name: 'substring-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<SubstringStep>,
      default: () => ({ name: 'substring', column: '', startIndex: 1, endIndex: -1 }),
    },
  },
  data() {
    return {
      stepname: 'substring' as PipelineStepName,
      title: 'Extract substring' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    stepSelectedColumn: {
      get() {
        return this.editedStep.column;
      },
      set(colname: string | null) {
        if (colname === null) {
          throw new Error('should not try to set null on "column" field');
        }
        this.editedStep.column = colname;
      },
    },
  },
});
</script>
