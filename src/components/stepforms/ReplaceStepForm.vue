<template>
  <div>
    <step-form-title :title="title"></step-form-title>
    <ColumnPicker
      id="searchColumnInput"
      v-model="editedStep.search_column"
      name="Search in column..."
      placeholder="Enter a column"
    ></ColumnPicker>
    <WidgetInputText
      id="newColumnInput"
      v-model="editedStep.new_column"
      name="(Optional) Write output in..."
      placeholder="Enter a new column name"
    ></WidgetInputText>
    <WidgetList
      addFieldName="Add a value to replace"
      id="toReplace"
      name="Values to replace:"
      v-model="toReplace"
      :defaultItem="[]"
      :widget="widgetToReplace"
      :automatic-new-field="false"
    ></WidgetList>
    <step-form-buttonbar :errors="errors" :cancel="cancelEdition" :submit="submit"></step-form-buttonbar>
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { Getter } from 'vuex-class';
import { StepFormComponent } from '@/components/formlib';
import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import WidgetInputText from '@/components/stepforms/WidgetInputText.vue';
import WidgetList from '@/components/stepforms/WidgetList.vue';
import WidgetToReplace from '@/components/stepforms/WidgetToReplace.vue';
import BaseStepForm from './StepForm.vue';
import { ReplaceStep } from '@/lib/steps';
import { DataSetColumn } from '@/lib/dataset';

@StepFormComponent({
  vqbstep: 'replace',
  name: 'replace-step-form',
  components: {
    ColumnPicker,
    WidgetInputText,
    WidgetList,
  },
})
export default class ReplaceStepForm extends BaseStepForm<ReplaceStep> {
  @Prop({ type: Object, default: () => ({ name: 'replace', search_column: '', to_replace: [[]] }) })
  initialStepValue!: ReplaceStep;

  @Getter columnHeaders!: DataSetColumn[];

  readonly title: string = 'Replace values';
  widgetToReplace = WidgetToReplace;

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
    if (type === 'integer' || type === 'float') {
      for (const tuple of this.editedStep.to_replace) {
        if (!isNaN(Number(tuple[0]))) {
          tuple[0] = Number(tuple[0]);
        }
        if (!isNaN(Number(tuple[1]))) {
          tuple[1] = Number(tuple[1]);
        }
      }
    } else if (type === 'boolean') {
      for (const tuple of this.editedStep.to_replace) {
        tuple[0] = tuple[0] === 'true';
        tuple[1] = tuple[1] === 'true';
      }
    }
    this.$$super.submit();
  }
}
</script>
