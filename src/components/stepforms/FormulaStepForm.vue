<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <InputTextWidget
      id="formulaInput"
      v-model="editedStep.formula"
      name="Formula:"
      placeholder
      data-path=".formula"
      :errors="errors"
    />
    <InputTextWidget
      id="newColumnInput"
      v-model="editedStep.new_column"
      name="New colum:"
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { parse } from 'mathjs';
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { FormulaStep } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'formula',
  name: 'formula-step-form',
  components: {
    InputTextWidget,
  },
})
export default class FormulaStepForm extends BaseStepForm<FormulaStep> {
  @Prop({ type: Object, default: () => ({ name: 'formula', new_column: '', formula: '' }) })
  initialStepValue!: FormulaStep;

  readonly title: string = 'Formula';

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.new_column)) {
      return `A column name "${this.editedStep.new_column}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.new_column });
    }
  }

  validate() {
    let ret = this.validator({ ...this.editedStep });
    let errors: ErrorObject[] = [];
    try {
      parse(this.editedStep.formula.replace(/\[.*?\]/g, 'var'));
    } catch {
      ret = false;
      errors.push({
        dataPath: '.formula',
        message: 'Parsing error: invalid formula',
        keyword: 'parsing',
        schemaPath: '.formula',
        params: '',
      });
    }
    if (ret === false) {
      errors = this.validator.errors ? [...errors, ...this.validator.errors] : errors;
      return errors;
    }
    return null;
  }
}
</script>
