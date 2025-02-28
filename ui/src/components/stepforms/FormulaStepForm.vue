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
      :trusted-variable-delimiters="trustedVariableDelimiters"
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
import { defineComponent, PropType } from 'vue';
import type { ErrorObject } from 'ajv';
import { parse } from 'mathjs';

import BaseStepForm from './StepForm.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { escapeForUseInRegExp } from '@/lib/helpers';
import type { Formula, FormulaStep, PipelineStepName } from '@/lib/steps';

export default defineComponent({
  name: 'formula-step-form',
  components: {
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<FormulaStep>,
      default: (): FormulaStep => ({
        name: 'formula',
        newColumn: '',
        formula: '',
      }),
    },
  },
  data() {
    return {
      stepname: 'formula' as PipelineStepName,
      title: 'Formula' as string,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    duplicateColumnName() {
      if (this.columnNames.includes(this.editedStep.newColumn)) {
        return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
  },
  methods: {
    submit() {
      this.$$super.submit();
      if (this.errors === null) {
        this.setSelectedColumns({ column: this.editedStep.newColumn });
      }
    },
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
    },
  },
});
</script>
