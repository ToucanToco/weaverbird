<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="searchColumnInput"
      v-model="editedStep.search_column"
      name="Search in column..."
      placeholder="Enter a column"
      data-path=".search_column"
      :errors="errors"
    ></ColumnPicker>
    <InputTextWidget
      id="newColumnInput"
      v-model="editedStep.new_column"
      name="(Optional) Write output in..."
      placeholder="Enter a new column name"
      data-path=".new_column"
      :errors="errors"
    ></InputTextWidget>
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
    ></ListWidget>
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { VQBModule } from '@/store';
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';
import BaseStepForm from './StepForm.vue';
import { ReplaceStep } from '@/lib/steps';
import { ColumnTypeMapping } from '@/lib/dataset';
import { castFromString } from '@/lib/helpers';

@StepFormComponent({
  vqbstep: 'replace',
  name: 'replace-step-form',
  components: {
    ColumnPicker,
    InputTextWidget,
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
