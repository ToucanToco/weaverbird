<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <MultiselectWidget
      id="keepColumnInput"
      v-model="editedStep.keep"
      name="Keep columnns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.keep[0] })"
      placeholder="Add columns to keep"
      data-path=".keep"
      :errors="errors"
    ></MultiselectWidget>
    <MultiselectWidget
      id="unpivotColumnInput"
      v-model="editedStep.unpivot"
      name="Unpivot columns..."
      :options="columnNames"
      @input="setSelectedColumns({ column: editedStep.unpivot[0] })"
      placeholder="Add columns to unpivot"
      data-path=".unpivot"
      :errors="errors"
    ></MultiselectWidget>
    <InputTextWidget
      id="unpivotColumnNameInput"
      v-model="editedStep.unpivot_column_name"
      name="Category column name"
      placeholder="Enter a column name"
      data-path=".unpivot_column_name"
      :errors="errors"
    ></InputTextWidget>
    <InputTextWidget
      id="valueColumnNameInput"
      v-model="editedStep.value_column_name"
      name="Value column name"
      placeholder="Enter a column name"
      data-path=".value_column_name"
      :errors="errors"
    ></InputTextWidget>
    <CheckboxWidget id="dropnaCheckbox" :label="checkboxLabel" v-model="editedStep.dropna"></CheckboxWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';
import { UnpivotStep } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'unpivot',
  name: 'unpivot-step-form',
  components: {
    CheckboxWidget,
    InputTextWidget,
    MultiselectWidget,
  },
})
export default class UnpivotStepForm extends BaseStepForm<UnpivotStep> {
  @Prop({
    type: Object,
    default: () => ({
      name: 'unpivot',
      keep: [],
      unpivot: [],
      unpivot_column_name: '',
      value_column_name: '',
      dropna: true,
    }),
  })
  initialStepValue!: UnpivotStep;

  readonly title: string = 'Unpivot columns';
  readonly checkboxLabel: string = 'Drop null values';

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    const ambiguousColumns = this.editedStep.keep
      .filter(colname => this.editedStep.unpivot.includes(colname))
      .sort();
    if (ambiguousColumns.length) {
      return [
        {
          params: [],
          schemaPath: '.unpivot',
          keyword: 'columnNameConflict',
          dataPath: '.unpivot',
          message: `Column names ${ambiguousColumns.join(
            ',',
          )} were used for both "keep" and "unpivot" fields`,
        },
      ];
    }
    if (
      this.editedStep.unpivot_column_name === this.editedStep.value_column_name ||
      this.editedStep.keep.includes(this.editedStep.unpivot_column_name) ||
      this.editedStep.unpivot.includes(this.editedStep.unpivot_column_name)
    ) {
      return [
        {
          params: [],
          schemaPath: '.unpivot_column_name',
          keyword: 'columnNameConflict',
          dataPath: '.unpivot_column_name',
          message: `Column name ${
            this.editedStep.unpivot_column_name
          } is used at least twice but should be unique`,
        },
      ];
    }
    if (
      this.editedStep.keep.includes(this.editedStep.value_column_name) ||
      this.editedStep.unpivot.includes(this.editedStep.value_column_name)
    ) {
      return [
        {
          params: [],
          schemaPath: '.value_column_name',
          keyword: 'columnNameConflict',
          dataPath: '.value_column_name',
          message: `Column name ${
            this.editedStep.value_column_name
          } is used at least twice but should be unique`,
        },
      ];
    }
    return null;
  }
}
</script>
