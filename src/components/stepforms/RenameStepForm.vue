<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="oldnameInput"
      v-model="editedStep.oldname"
      name="Replace..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.oldname })"
      placeholder="Enter the old column name"
    ></WidgetAutocomplete>
    <WidgetInputText
      id="newnameInput"
      v-model="editedStep.newname"
      name="By..."
      placeholder="Enter a new column name"
    ></WidgetInputText>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import renameSchema from '@/assets/schemas/rename-step__schema.json';
import { StepFormComponent } from '@/components/formlib';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import BaseStepForm from './StepForm.vue';
import { RenameStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'rename',
  name: 'rename-step-form',
  components: {
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class RenameStepForm extends BaseStepForm<RenameStep> {
  @Prop({ type: Object, default: () => ({ name: 'rename', oldname: '', newname: '' }) })
  initialStepValue!: RenameStep;

  readonly title: string = 'Rename Column';
  editedStepModel = renameSchema;

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

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    if (this.columnNames.includes(this.editedStep.newname)) {
      return [
        {
          params: [],
          schemaPath: '.newname',
          keyword: 'nameAlreadyUsed',
          dataPath: '.newname',
          message: 'This column name is already used.',
        },
      ];
    }
    return null;
  }

  submit() {
    this.$$super.submit();
    this.setSelectedColumns({ column: this.editedStep.newname });
  }
}
</script>
