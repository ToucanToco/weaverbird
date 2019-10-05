<template>
  <div>
    <step-form-title :title="title" />
    <ColumnPicker
      id="column"
      v-model="editedStep.column"
      name="Extract a substring from..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      id="startIndex"
      v-model.number="editedStep.start_index"
      type="number"
      name="Substring starts at character position:"
      placeholder="Enter an integer"
      data-path=".start_index"
      :errors="errors"
    />
    <InputTextWidget
      id="endIndex"
      v-model.number="editedStep.end_index"
      type="number"
      name="And ends at character position:"
      placeholder="Enter an integer"
      data-path=".end_index"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { SubstringStep } from '@/lib/steps';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';

@StepFormComponent({
  vqbstep: 'substring',
  name: 'substring-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class SubstringStepForm extends BaseStepForm<SubstringStep> {
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
