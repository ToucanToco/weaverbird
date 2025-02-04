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
import { defineComponent, PropType } from 'vue';

import BaseStepForm from './StepForm.vue';
import AutocompleteWidget from './widgets/Autocomplete.vue';
import CheckboxWidget from '@/components/stepforms/widgets/Checkbox.vue';
import InputTextWidget from './widgets/InputText.vue';
import ListWidget from './widgets/List.vue';
import type { HierarchyStep, PipelineStepName } from '@/lib/steps';

export default defineComponent({
  name: 'hierarchy-step-form',
  components: {
    AutocompleteWidget,
    CheckboxWidget,
    InputTextWidget,
    ListWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<HierarchyStep>,
      default: () => ({
        name: 'hierarchy',
        hierarchyLevelColumn: 'hierarchy_level',
        hierarchy: [],
        includeNulls: false,
      }),
    },
  },
  data() {
    return {
      stepname: 'hierarchy' as PipelineStepName,
      title: 'Aggregate geographical data by hierarchy' as string,
      widgetAutocomplete: AutocompleteWidget,
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  methods: {
    submit() {
      this.$$super.submit();
    },
  },
});
</script>
