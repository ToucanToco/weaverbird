<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="columnInput"
      v-model="column"
      name="Delete column:"
      :options="columnNames"
      @input="setSelectedColumns({ column })"
      placeholder="Enter a column"
    ></WidgetAutocomplete>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import deleteSchema from '@/assets/schemas/delete-column-step__schema.json';
import { StepFormComponent } from '@/components/formlib';
import StepFormTitle from '@/components/stepforms/StepFormTitle.vue';
import StepFormButtonbar from '@/components/stepforms/StepFormButtonbar.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import BaseStepForm from './StepForm.vue';
import { Writable, DeleteStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'delete',
  name: 'delete-step-form',
  components: {
    WidgetAutocomplete,
    StepFormTitle,
    StepFormButtonbar
  },
})
export default class DeletStepForm extends BaseStepForm {
  @Prop({ type: Object, default: () => ({ name: 'delete', columns: [''] }) })
  initialStepValue!: DeleteStep;

  readonly title: string = 'Delete Column Step';

  // Only manage the deletion of 1 column at once at this stage
  editedStep: Writable<DeleteStep> = { ...this.initialStepValue };
  editedStepModel = deleteSchema;
  column: string = this.editedStep.columns[0];

  stepToValidate() {
    return { name: 'delete', column: this.column };
  }

  rebuildStep() {
    return { name: 'delete', columns: [this.column] };
  }

  get stepSelectedColumn() {
    return this.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on delete "column" field');
    }
    if (colname !== null) {
      this.column = colname;
    }
  }

}
</script>
