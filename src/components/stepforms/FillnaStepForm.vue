<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      v-model="editedStep.column"
      id="columnInput"
      name="Replace null values in..."
      placeholder="Enter a column"
    ></ColumnPicker>
    <InputTextWidget
      id="valueInput"
      v-model="editedStep.value"
      name="With..."
      placeholder="Enter a value"
    ></InputTextWidget>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import BaseStepForm from './StepForm.vue';
import { FillnaStep } from '@/lib/steps';
import { DataSetColumn } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';

@StepFormComponent({
  vqbstep: 'fillna',
  name: 'fillna-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class FillnaStepForm extends BaseStepForm<FillnaStep> {
  @Prop({ type: Object, default: () => ({ name: 'fillna', column: '', value: '' }) })
  initialStepValue!: FillnaStep;

  @Getter columnHeaders!: DataSetColumn[];

  readonly title: string = 'Fill null values';

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

  submit() {
    const type = this.columnHeaders.filter(h => h.name === this.editedStep.column)[0].type;
    if (type !== undefined) {
      this.editedStep.value = castFromString(this.editedStep.value as string, type);
    }
    this.$$super.submit();
  }
}
</script>
