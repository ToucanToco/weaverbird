<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <ColumnPicker
      v-model="editedStep.oldname"
      class="oldnameInput"
      name="Old name:"
      placeholder="Enter the old column name"
      data-path=".oldname"
      :errors="errors"
    />
    <InputTextWidget
      class="newnameInput"
      v-model="editedStep.newname"
      name="New name:"
      placeholder="Enter a new column name"
      data-path=".newname"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { RenameStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

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
