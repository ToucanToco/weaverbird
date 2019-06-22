<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <WidgetAutocomplete
      id="columnInput"
      v-model="editedStep.column"
      name="Fill null valuessss in:"
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.column })"
      placeholder="Enter a column"
    ></WidgetAutocomplete>
    <WidgetInputText
      id="valueInput"
      v-model="editedStep.value"
      name="With:"
      placeholder="Enter a value"
    ></WidgetInputText>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import fillnaSchema from '@/assets/schemas/fillna-step__schema.json';
import { StepFormComponent } from '@/components/formlib';
import StepFormTitle from '@/components/stepforms/StepFormTitle.vue';
import StepFormButtonbar from '@/components/stepforms/StepFormButtonbar.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetAutocomplete from '@/components/stepforms/WidgetAutocomplete.vue';
import BaseStepForm from './StepForm.vue';
import { Writable, FillnaStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'fillna',
  name: 'fillna-step-form',
  components: {
    BaseStepForm,
    StepFormTitle,
    StepFormButtonbar,
    WidgetAutocomplete,
    WidgetInputText,
  },
})
export default class FillnaStepForm extends BaseStepForm {
  @Prop({ type: Object, default: () => ({ name: 'fillna', column: '', value: '' }) })
  initialStepValue!: FillnaStep;

  readonly title: string = 'Fill Null Values Step';
  editedStep: Writable<FillnaStep> = { ...this.initialStepValue };
  editedStepModel = fillnaSchema;


  get stepSelectedColumn() {
    return this.editedStep.column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on fillna "column" field');
    }
    if (colname !== null) {
      this.editedStep.column = colname;
    }
  }

}
</script>
