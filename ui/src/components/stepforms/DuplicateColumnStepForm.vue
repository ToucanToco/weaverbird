<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="columnInput"
      v-model="editedStep.column"
      name="Duplicate column..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="newColumnNameInput"
      v-model="editedStep.newColumnName"
      name="New column name:"
      placeholder="Enter a column name"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { DuplicateColumnStep, PipelineStepName } from '@/lib/steps';
import BaseStepForm from './StepForm.vue';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';

export default defineComponent({
  name: 'duplicate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<DuplicateColumnStep>,
      default: (): DuplicateColumnStep => ({
        name: 'duplicate',
        column: '',
        newColumnName: '',
      }),
    },
  },
  data() {
    return {
      stepname: 'duplicate' as PipelineStepName,
      title: 'Duplicate column' as string,
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
          throw new Error('should not try to set null on duplicate "column" field');
        }
        this.editedStep.column = colname;
      },
    },
  },
});
</script>
