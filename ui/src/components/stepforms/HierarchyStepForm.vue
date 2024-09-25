<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <InputTextWidget
      v-model="editedStep.hierarchyLevelColumn"
      name="Hierarchy level column"
      placeholder="Hierarchy level column"
      data-path=".hierarchyLevelColumn"
      :errors="errors"
    />
    <ListWidget
      v-model="editedStep.hierarchy"
      addFieldName="Add hierarchy level"
      name="Add hierarchy"
      :widget="widgetAutocomplete"
      :options="columnNames"
      :automatic-new-field="false"
      data-path=".hierarchy"
      :errors="errors"
      :componentProps="{ allowCustom: true }"
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <CheckboxWidget label="Include null values in results" v-model="editedStep.includeNulls" />
    <StepFormButtonbar />
  </div>
</template>
<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import type { HierarchyStep, PipelineStepName } from '@/lib/steps';

import BaseStepForm from './StepForm.vue';
import AutocompleteWidget from './widgets/Autocomplete.vue';
import InputTextWidget from './widgets/InputText.vue';
import ListWidget from './widgets/List.vue';

@Component({
  name: 'hierarchy-step-form',
  components: {
    AutocompleteWidget,
    CheckboxWidget,
    InputTextWidget,
    ListWidget,
  },
})
export default class HierarchyStepForm extends BaseStepForm<HierarchyStep> {
  stepname: PipelineStepName = 'hierarchy';

  @Prop({
    type: Object,
    default: () => ({
      name: 'hierarchy',
      hierarchyLevelColumn: 'hierarchy_level',
      hierarchy: [],
      includeNulls: false,
    }),
  })
  declare initialStepValue: HierarchyStep;

  readonly title: string = 'Aggregate geographical data by hierarchy';
  widgetAutocomplete = AutocompleteWidget;

  submit() {
    this.$$super.submit();
  }
}
</script>
