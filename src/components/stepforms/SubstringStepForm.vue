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
    />
    <InputTextWidget
      class="startIndex"
      v-model.number="editedStep.start_index"
      type="number"
      name="Substring starts at character position:"
      placeholder="Enter an integer"
      data-path=".start_index"
      :errors="errors"
    />
    <InputTextWidget
      class="endIndex"
      v-model.number="editedStep.end_index"
      type="number"
      name="And ends at character position:"
      placeholder="Enter an integer"
      data-path=".end_index"
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { PipelineStepName, SubstringStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'substring-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class SubstringStepForm extends BaseStepForm<SubstringStep> {
  stepname: PipelineStepName = 'substring';

  @Prop({
    type: Object,
    default: () => ({ name: 'substring', column: '', start_index: 1, end_index: -1 }),
  })
  initialStepValue!: SubstringStep;

  readonly title: string = 'Extract substring';

  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on "column" field');
    }
    this.editedStep.column = colname;
  }
}
</script>
