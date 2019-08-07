<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="searchColumnInput"
      v-model="editedStep.search_column"
      name="Search in column..."
      placeholder="Enter a column"
    ></ColumnPicker>
    <InputTextWidget
      id="newColumnInput"
      v-model="editedStep.new_column"
      name="(Optional) Write output in..."
      placeholder="Enter a new column name"
    ></InputTextWidget>
    <ListWidget
      addFieldName="Add a value to replace"
      id="toReplace"
      name="Values to replace:"
      v-model="toReplace"
      :defaultItem="[]"
      :widget="replaceWidget"
      :automatic-new-field="false"
    ></ListWidget>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { VQBModule } from '@/store';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import ReplaceWidget from '@/components/stepforms/widgets/Replace.vue';
import BaseStepForm from './StepForm.vue';
import { ReplaceStep } from '@/lib/steps';
import { DataSetColumn } from '@/lib/dataset';
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

  @VQBModule.Getter columnHeaders!: DataSetColumn[];

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
    const type = this.columnHeaders.filter(h => h.name === this.editedStep.search_column)[0].type;
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
