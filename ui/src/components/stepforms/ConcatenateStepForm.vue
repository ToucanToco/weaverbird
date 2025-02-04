<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ListWidget
      addFieldName="Add columns"
      class="toConcatenate"
      name="Columns to concatenate:"
      v-model="toConcatenate"
      :defaultItem="[]"
      :widget="columnPicker"
      :componentProps="{ syncWithSelectedColumn: false }"
      :automatic-new-field="false"
      data-path=".columns"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      class="separator"
      v-model="editedStep.separator"
      name="Separator:"
      placeholder="Enter string of any length"
      data-path=".separator"
      :errors="errors"
    />
    <InputTextWidget
      class="newColumnName"
      v-model="editedStep.newColumnName"
      name="New column name:"
      placeholder="Enter a columnn name"
      data-path=".newColumnName"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import type { ConcatenateStep, PipelineStepName } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import BaseStepForm from './StepForm.vue';

export default defineComponent({
  name: 'concatenate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
    ListWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<ConcatenateStep>,
      default: (): ConcatenateStep => ({
        name: 'concatenate',
        columns: [''],
        separator: '',
        newColumnName: '',
      }),
    },
  },
  data(): {
    stepname: PipelineStepName;
    title: string;
    columnPicker: typeof ColumnPicker;
    editedStep: ConcatenateStep;
  } {
    return {
      stepname: 'concatenate',
      title: 'Concatenate columns',
      columnPicker: ColumnPicker,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    toConcatenate: {
      get(): string[] {
        if (this.editedStep.columns.length) {
          return this.editedStep.columns;
        } else {
          return [''];
        }
      },
      set(newval: string[]) {
        this.editedStep.columns = [...newval];
      },
    },
  },
  mounted() {
    if (this.isStepCreation && this.selectedColumns[0]) {
      this.editedStep = {
        name: 'concatenate' as 'concatenate',
        columns: [this.selectedColumns[0]],
        separator: '',
        newColumnName: '',
      };
    } else {
      this.editedStep = { ...this.initialStepValue };
    }
  },
});
</script>
