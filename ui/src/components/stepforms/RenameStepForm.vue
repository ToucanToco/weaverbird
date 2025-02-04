<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="this.editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <ListWidget
      addFieldName="Add column"
      class="toReplace"
      name="Columns to rename:"
      placeholderOldVal="Column to rename"
      placeholderNewVal="New value"
      v-model="toRename"
      :defaultItem="['', '']"
      :widget="renameWidget"
      :automatic-new-field="false"
      data-path=".toRename"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      unstyled-items
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import BaseStepForm from './StepForm.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import RenameWidget from '@/components/stepforms/widgets/Rename.vue';
import type { PipelineStepName, RenameStep } from '@/lib/steps';

export default defineComponent({
  name: 'rename-step-form',
  components: {
    ListWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<RenameStep>,
      default: (): Partial<RenameStep> => ({
        name: 'rename',
        toRename: [['', '']],
      }),
    },
  },
  data() {
    return {
      stepname: 'rename' as PipelineStepName,
      readonly: false,
      title: 'Rename Column' as string,
      renameWidget: RenameWidget,
      /** Overload the definition of editedStep in BaseStepForm to guarantee retrocompatibility,
       *  as we have to manage historical configurations where only one column at a time could be
       * renamed via the 'newname' and 'oldname' parameter, now optional and not useful. So we
       * convert them into a 'toRename' array upfront */
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
        toRename:
          this.initialStepValue.oldname && this.initialStepValue.newname
            ? [[this.initialStepValue.oldname, this.initialStepValue.newname]]
            : this.initialStepValue.toRename,
        oldname: undefined,
        newname: undefined,
      },
    };
  },
  computed: {
    stepSelectedColumn: {
      get() {
        return null;
      },
      set(colname: string | null) {
        if (colname === null) {
          throw new Error('should not try to set null in rename "toRename" field');
        }
        if (colname !== null && this.editedStep.toRename[0][0] === '') {
          this.editedStep.toRename[0].splice(0, 1, colname);
        }
      },
    },
    toRename: {
      get() {
        return this.editedStep.toRename;
      },
      set(newval) {
        this.editedStep.toRename = [...newval];
      },
    },
  },
  methods: {
    submit() {
      this.$$super.submit();
      if (this.errors === null) {
        this.setSelectedColumns({
          column: this.editedStep.toRename[this.editedStep.toRename.length - 1][1],
        });
      }
    },
  },
});
</script>
