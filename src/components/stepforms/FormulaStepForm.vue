<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.new_column"
      name="New colum:"
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
      :warning="duplicateColumnName"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :advanced-variable-delimiters="advancedVariableDelimiters"
      :use-advanced-variable="true"
    />
    <InputTextWidget
      class="formulaInput"
      v-model="editedStep.formula"
      name="Formula:"
      placeholder
      data-path=".formula"
      :errors="errors"
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
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'formula',
  name: 'formula-step-form',
  components: {
    InputTextWidget,
  },
})
export default class FormulaStepForm extends BaseStepForm<FormulaStep> {
  @VQBModule.State availableVariables!: VariablesBucket;

  @VQBModule.State variableDelimiters!: VariableDelimiters;

  @VQBModule.State advancedVariableDelimiters!: VariableDelimiters;

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
