<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="column"
      v-model="editedStep.column"
      name="Column to convert:"
      :options="columnNames"
      placeholder="Add columns"
      data-path=".columns"
      :errors="errors"
    />
    <InputTextWidget
      v-if="this.translator === 'mongo40'"
      id="dateFormat"
      v-model.number="editedStep.format"
      name="Date format:"
      placeholder="%Y-%m-%d"
      data-path=".format"
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
import { ToDateStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'todate',
  name: 'todate-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ToDateStepForm extends BaseStepForm<ToDateStep> {
  @Prop({ type: Object, default: () => ({ name: 'todate', column: '' }) })
  initialStepValue!: ToDateStep;

  @VQBModule.Getter translator!: string;

  readonly title: string = 'Convert Column From Text to Date';

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
