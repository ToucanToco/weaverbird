<template>
  <div class="ifthenelse-form">
    <StepFormHeader :title="title" :stepName="editedStep.name" :version="version" />
    <InputTextWidget
      class="newColumnInput"
      v-model="editedStep.newColumn"
      name="New colum:"
      placeholder="Enter a name"
      data-path=".newColumn"
      :errors="errors"
      :warning="duplicateColumnName"
    />
    <IfThenElseWidget
      isRoot
      :value="ifthenelse"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      @input="updateIfThenElse"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import _omit from 'lodash/omit';
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import { castFilterStepTreeValue } from '@/components/stepforms/convert-filter-step-tree.ts';
import IfThenElseWidget from '@/components/stepforms/widgets/IfThenElseWidget.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { IfThenElseStep } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

/**
Applies the castFilterStepTreeValue function recursively to every condition
object found in "if" keys of an if...then...else data structure, which can be
nested.
*/
function castIfThenElse(
  ifThenElseObj: Omit<IfThenElseStep, 'name' | 'newColumn'>,
  columnTypes: ColumnTypeMapping,
) {
  const newObj = { ...ifThenElseObj };
  newObj.if = castFilterStepTreeValue(newObj.if, columnTypes);
  if (typeof newObj.else !== 'string') {
    // then it's a nested if...then...else object
    newObj.else = castIfThenElse(newObj.else, columnTypes);
  }
  return newObj;
}

@StepFormComponent({
  vqbstep: 'ifthenelse',
  name: 'ifthenelse-step-form',
  components: {
    IfThenElseWidget,
    InputTextWidget,
  },
})
export default class IfThenElseStepForm extends BaseStepForm<IfThenElseStep> {
  @VQBModule.State availableVariables?: VariablesBucket;

  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({
      name: 'ifthenelse',
      newColumn: '',
      if: { column: '', value: '', operator: 'eq' },
      then: '',
      else: '',
    }),
  })
  initialStepValue!: IfThenElseStep;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Add a conditional column';

  ifthenelse = _omit({ ...this.initialStepValue }, ['name', 'newColumn']);

  get duplicateColumnName() {
    if (this.columnNames.includes(this.editedStep.newColumn)) {
      return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  submit() {
    const ifThenElseCast = castIfThenElse(
      _omit(this.editedStep, ['name', 'newColumn']),
      this.columnTypes,
    );
    this.editedStep = {
      ...this.editedStep,
      ...ifThenElseCast,
    };
    this.$$super.submit();
  }

  updateIfThenElse(ifthenelse: Omit<IfThenElseStep, 'name' | 'newColumn'>) {
    this.editedStep = {
      ...this.editedStep,
      ...ifthenelse,
    };
    this.ifthenelse = ifthenelse;
  }
}
</script>

<style lang="scss" scoped>
.filter-form-headers__container {
  display: flex;
  width: 66%;
}

.filter-form-header {
  font-size: 14px;
  margin-left: 10px;
  width: 50%;
}
</style>
<style lang="scss">
.filter-form {
  .widget-list__body .widget-list__icon {
    top: 5px;
  }
  .widget-list__component-sep {
    left: 0;
    position: absolute;
    top: 10px;
  }
}
.filter-form--multiple-conditions {
  .filter-form-headers__container {
    margin-left: 30px;
  }
  .widget-list__component {
    margin-left: 30px;
  }
}
</style>
