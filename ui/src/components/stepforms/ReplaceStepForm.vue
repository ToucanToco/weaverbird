<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ColumnPicker
      class="searchColumnInput"
      v-model="editedStep.searchColumn"
      name="Search in column..."
      placeholder="Enter a column"
      data-path=".searchColumn"
      :errors="errors"
    />
    <ListWidget
      addFieldName="Add a value to replace"
      class="toReplace"
      name="Values to replace:"
      v-model="toReplace"
      :defaultItem="[]"
      :widget="replaceWidget"
      :automatic-new-field="false"
      data-path=".toReplace"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      unstyled-items
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';
import type { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';
import type { PipelineStepName, ReplaceStep } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';
import { State, Getter } from 'pinia-class';

import BaseStepForm from './StepForm.vue';

@Component({
  name: 'replace-step-form',
  components: {
    ColumnPicker,
    ListWidget,
  },
})
export default class ReplaceStepForm extends BaseStepForm<ReplaceStep> {
  stepname: PipelineStepName = 'replace';

  @State(VQBModule) availableVariables?: VariablesBucket;

  @State(VQBModule) variableDelimiters?: VariableDelimiters;

  @Prop({ type: Object, default: () => ({ name: 'replace', searchColumn: '', toReplace: [[]] }) })
  declare initialStepValue: ReplaceStep;

  @Getter(VQBModule) columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Replace values';
  replaceWidget = ReplaceWidget;

  get stepSelectedColumn() {
    return this.editedStep.searchColumn;
  }

  set stepSelectedColumn(colname: string) {
    this.editedStep.searchColumn = colname;
  }

  get toReplace() {
    if (this.editedStep.toReplace.length) {
      return this.editedStep.toReplace;
    } else {
      return [[]];
    }
  }

  set toReplace(newval) {
    this.editedStep.toReplace = [...newval];
  }

  submit() {
    const type = this.columnTypes[this.editedStep.searchColumn];
    for (const tuple of this.editedStep.toReplace) {
      if (type !== undefined) {
        tuple[0] = castFromString(tuple[0], type);
        tuple[1] = castFromString(tuple[1], type);
      }
    }
    this.$$super.submit();
  }
}
</script>
