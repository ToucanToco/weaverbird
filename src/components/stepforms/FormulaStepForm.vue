<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <InputTextWidget id="formulaInput" v-model="editedStep.formula" name="Formula:" placeholder></InputTextWidget>
    <InputTextWidget
      id="newColumnInput"
      v-model="editedStep.new_column"
      name="New colum:"
      placeholder="Enter a new column name"
    ></InputTextWidget>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import BaseStepForm from './StepForm.vue';
import { FormulaStep } from '@/lib/steps';
import { parse } from 'mathjs';
import { ErrorObject } from 'ajv';

type VqbError = Partial<ErrorObject>;

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
      parse(this.editedStep.formula);
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
