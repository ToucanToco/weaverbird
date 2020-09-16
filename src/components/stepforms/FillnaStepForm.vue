<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <MultiselectWidget
      class="columnInput"
      v-model="editedStep.column"
      name="Replace null values in..."
      :options="columnNames"
      placeholder="Select columns"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      class="valueInput"
      v-model="editedStep.value"
      name="With..."
      placeholder="Enter a value"
      data-path=".value"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';
import { FillnaStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'fillna',
  name: 'fillna-step-form',
  components: {
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class FillnaStepForm extends BaseStepForm<FillnaStep> {
  @Prop({ type: Object, default: () => ({ name: 'fillna', column: [''], value: '' }) })
  initialStepValue!: FillnaStep;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Fill null values';

  /** Overload the definition of editedStep in BaseStepForm to guarantee retrocompatibility,
   *  as we have to manage historical configurations where only one column at a time could be
   * filled */
  editedStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    column:
      typeof this.initialStepValue.column === 'string'
        ? [this.initialStepValue.column]
        : this.initialStepValue.column,
  };

  get stepSelectedColumn() {
    return null;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on fillna "column" field');
    }
    // if (
    //   (typeof this.editedStep.column === 'string' && this.editedStep.column === '') ||
    //   this.editedStep.column[0] === ''
    // ) {
    //   this.editedStep.column = [colname];
    // }
    this.editedStep.column = [colname];
  }

  submit() {
    // if (typeof this.editedStep.column === 'string') {
    //   // For retrocompatibility purposes
    //   this.editedStep.column = [this.editedStep.column];
    // }
    const type = this.columnTypes[this.editedStep.column[0]];
    if (type !== undefined) {
      this.editedStep.value = castFromString(this.editedStep.value as string, type);
    }
    this.$$super.submit();
  }
}
</script>
