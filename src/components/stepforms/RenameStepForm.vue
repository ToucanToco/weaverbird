<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      v-model="editedStep.oldname"
      id="oldnameInput"
      name="Old name"
      placeholder="Enter the old column name"
      data-path=".oldname"
      :errors="errors"
    ></ColumnPicker>
    <InputTextWidget
      id="newnameInput"
      v-model="editedStep.newname"
      name="By..."
      placeholder="Enter a new column name"
      data-path=".newname"
      :errors="errors"
    ></InputTextWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import BaseStepForm from './StepForm.vue';
import { RenameStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'rename',
  name: 'rename-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class RenameStepForm extends BaseStepForm<RenameStep> {
  @Prop({ type: Object, default: () => ({ name: 'rename', oldname: '', newname: '' }) })
  initialStepValue!: RenameStep;

  readonly title: string = 'Rename Column';

  get stepSelectedColumn() {
    return this.editedStep.oldname;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on rename "oldname" field');
    }
    if (colname !== null) {
      this.editedStep.oldname = colname;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.newname });
    }
  }
}
</script>
