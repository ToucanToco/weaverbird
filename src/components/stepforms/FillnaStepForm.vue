<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <MultiselectWidget
      class="columnInput"
      v-model="editedStep.columns"
      name="Replace null values in..."
      :options="columnNames"
      placeholder="Select columns"
      data-path=".columns"
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
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';
import { FillnaStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import MultiselectWidget from './widgets/Multiselect.vue';

@Component({
  name: 'fillna-step-form',
  components: {
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class FillnaStepForm extends BaseStepForm<FillnaStep> {
  stepname: PipelineStepName = 'fillna';

  @Prop({
    type: Object,
    default: () => ({ name: 'fillna', column: undefined, value: '', columns: [] }),
  })
  initialStepValue!: FillnaStep;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Fill null values';

  /** Overload the definition of editedStep in BaseStepForm to guarantee retrocompatibility,
   *  as we have to manage historical configurations where only one column at a time could be
   * filled */
  editedStep = {
    ...this.initialStepValue,
    ...this.stepFormDefaults,
    columns: this.initialStepValue.column
      ? [this.initialStepValue.column]
      : this.initialStepValue.columns,
    column: undefined,
  };

  get stepSelectedColumn() {
    return null;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on fillna "column" field');
    }
    this.editedStep.columns = [colname];
  }

  submit() {
    const type = this.columnTypes[this.editedStep.columns[0]];
    if (type !== undefined) {
      this.editedStep.value = castFromString(this.editedStep.value as string, type);
    }
    this.$$super.submit();
  }
}
</script>
