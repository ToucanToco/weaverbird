<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New column:"
      placeholder="Enter a new column name"
      data-path=".newColumn"
      :errors="errors"
      :warning="duplicateColumnName"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
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
import type { ErrorObject } from 'ajv';
import { parse } from 'mathjs';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { escapeForUseInRegExp } from '@/lib/helpers';
import type { Formula, FormulaStep, PipelineStepName } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';
import { State } from 'pinia-class';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'formula-step-form',
  components: {
    InputTextWidget,
  },
})
export default class FormulaStepForm extends BaseStepForm<FormulaStep> {
  stepname: PipelineStepName = 'formula';

  @State(VQBModule) availableVariables?: VariablesBucket;

  @State(VQBModule) variableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'formula', newColumn: '', formula: '' }) })
  declare initialStepValue: FormulaStep;

  readonly title: string = 'Formula';

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.newColumn)) {
      return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    this.$$super.submit();
    if (this.errors === null) {
      this.setSelectedColumns({ column: this.editedStep.newColumn });
    }
  }

  validate() {
    let ret = this.validator({ ...this.editedStep });
    let errors: ErrorObject[] = [];
    // Prevent formula to be interpolated with another type than string
    const formula: Formula = this.editedStep.formula;
    try {
      if (typeof formula === 'string') {
        let formulaEscaped = formula;
        const regexCols = new RegExp(
          `${escapeForUseInRegExp('[')}(.*?)${escapeForUseInRegExp(']')}`,
          'g',
        );
        formulaEscaped = formulaEscaped.replace(regexCols, 'col');
        if (this.variableDelimiters) {
          const regexVars = new RegExp(
            `${escapeForUseInRegExp(this.variableDelimiters.start)}(.*?)${escapeForUseInRegExp(
              this.variableDelimiters.end,
            )}`,
            'g',
          );
          formulaEscaped = formulaEscaped.replace(regexVars, 'var');
        }
        parse(formulaEscaped);
      }
    } catch (e) {
      console.error('Error while parsing formula:', formula, e);
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
