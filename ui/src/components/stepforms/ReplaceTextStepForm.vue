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
      v-model="editedStep.searchColumn"
      name="Extract a substring from..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <InputTextWidget
      v-model="editedStep.oldStr"
      name="Old string"
      placeholder="Text to replace"
      :errors="errors"
    />
    <InputTextWidget
      v-model="editedStep.newStr"
      name="New string"
      placeholder="Replacement text"
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
import type { PipelineStepName, ReplaceTextStep } from '@/lib/steps';

export default defineComponent({
  name: 'replacetext-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<Partial<ReplaceTextStep>>,
      default: (): Partial<ReplaceTextStep> => ({
        name: 'replacetext',
        searchColumn: '',
        oldStr: '',
        newStr: '',
      }),
    },
  },
  data() {
    return {
      stepname: 'replacetext' as PipelineStepName,
      title: 'Replace text' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    stepSelectedColumn: {
      get() {
        return this.editedStep.searchColumn;
      },
      set(colname: string) {
        this.editedStep.searchColumn = colname;
      },
    },
  },
  methods: {
    submit() {
      this.$$super.submit();
    },
  },
});
</script>
