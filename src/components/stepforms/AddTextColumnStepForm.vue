<template>
  <div>
    <step-form-title :title="title" />
    <InputTextWidget
      id="textInput"
      v-model="editedStep.text"
      name="Enter a text:"
      placeholder
      data-path=".text"
      :errors="errors"
    />
    <InputTextWidget
      id="newColumnInput"
      v-model="editedStep.new_column"
      name="New colum:"
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import BaseStepForm from './StepForm.vue';
import { AddTextColumnStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'text',
  name: 'text-step-form',
  components: {
    InputTextWidget,
  },
})
export default class AddTextColumnStepForm extends BaseStepForm<AddTextColumnStep> {
  @Prop({ type: Object, default: () => ({ name: 'text', new_column: '', text: '' }) })
  initialStepValue!: AddTextColumnStep;

  readonly title: string = 'Add Text Column';

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.new_column)) {
      return `A column name "${this.editedStep.new_column}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.new_column });
    }
  }
}
</script>
