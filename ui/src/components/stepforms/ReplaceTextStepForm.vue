<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="column"
      v-model="editedStep.searchColumn"
      name="Extract a substring from..."
      placeholder="Enter a column"
      data-path=".column"
      :errors="errors"
    />
    <InputTextWidget
      v-model="editedStep.oldStr"
      name="Old string"
      placeholder="Text to replace"
      :errors="errors"
    />
    <InputTextWidget
      v-model="editedStep.newStr"
      name="New string"
      placeholder="Replacement text"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { ColumnTypeMapping } from '@/lib/dataset';
import type { PipelineStepName, ReplaceTextStep } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { State, Getter } from 'pinia-class';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'replacetext-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class ReplaceTextStepForm extends BaseStepForm<ReplaceTextStep> {
  stepname: PipelineStepName = 'replacetext';

  @State(VQBModule) availableVariables?: VariablesBucket;

  @State(VQBModule) variableDelimiters?: VariableDelimiters;

  @Prop({
    type: Object,
    default: () => ({ name: 'replacetext', searchColumn: '', oldStr: '', newStr: '' }),
  })
  declare initialStepValue: ReplaceTextStep;

  @Getter(VQBModule) columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Replace text';

  get stepSelectedColumn() {
    return this.editedStep.searchColumn;
  }

  set stepSelectedColumn(colname: string) {
    this.editedStep.searchColumn = colname;
  }

  submit() {
    this.$$super.submit();
  }
}
</script>
