<template>
  <div>
    <step-form-title :title="title" :stepName="this.editedStep.name" />
    <ColumnPicker
      id="searchColumnInput"
      v-model="editedStep.search_column"
      name="Search in column..."
      placeholder="Enter a column"
      data-path=".search_column"
      :errors="errors"
    />
    <ListWidget
      addFieldName="Add a value to replace"
      id="toReplace"
      name="Values to replace:"
      v-model="toReplace"
      :defaultItem="[]"
      :widget="replaceWidget"
      :automatic-new-field="false"
      data-path=".to_replace"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { VQBModule } from '@/store';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';
import { ReplaceStep } from '@/lib/steps';
import { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';

import BaseStepForm from './StepForm.vue';

@StepFormComponent({
  vqbstep: 'replace',
  name: 'replace-step-form',
  components: {
    ColumnPicker,
    ListWidget,
  },
})
export default class ReplaceStepForm extends BaseStepForm<ReplaceStep> {
  @Prop({ type: Object, default: () => ({ name: 'replace', search_column: '', to_replace: [[]] }) })
  initialStepValue!: ReplaceStep;

  @VQBModule.Getter columnTypes!: ColumnTypeMapping;

  readonly title: string = 'Replace values';
  replaceWidget = ReplaceWidget;

  get stepSelectedColumn() {
    return this.editedStep.search_column;
  }

  set stepSelectedColumn(colname: string | null) {
    if (colname === null) {
      throw new Error('should not try to set null on search_column field');
    }
    this.editedStep.search_column = colname;
  }

  get toReplace() {
    if (this.editedStep.to_replace.length) {
      return this.editedStep.to_replace;
    } else {
      return [[]];
    }
  }

  set toReplace(newval) {
    this.editedStep.to_replace = [...newval];
  }

  submit() {
    const type = this.columnTypes[this.editedStep.search_column];
    for (const tuple of this.editedStep.to_replace) {
      if (type !== undefined) {
        tuple[0] = castFromString(tuple[0], type);
        tuple[1] = castFromString(tuple[1], type);
      }
    }
    this.$$super.submit();
  }
}
</script>
