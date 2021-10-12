<template>
  <div class="ifthenelse-form">
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
      :column-types="columnTypes"
      @input="updateIfThenElse"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import _omit from 'lodash/omit';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import IfThenElseWidget from '@/components/stepforms/widgets/IfThenElseWidget.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import { ColumnTypeMapping } from '@/lib/dataset';
import { IfThenElseStep, PipelineStepName } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'ifthenelse-step-form',
  components: {
    IfThenElseWidget,
    InputTextWidget,
  },
})
export default class IfThenElseStepForm extends BaseStepForm<IfThenElseStep> {
  stepname: PipelineStepName = 'ifthenelse';

  @VQBModule.State availableVariables?: VariablesBucket;
  @VQBModule.State variableDelimiters?: VariableDelimiters;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

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
    this.editedStep = {
      ...this.editedStep,
      ..._omit(this.editedStep, ['name', 'newColumn']),
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
