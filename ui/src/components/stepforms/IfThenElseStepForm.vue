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
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :column-types="columnTypes"
      @input="updateIfThenElse"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import _omit from 'lodash/omit';

import BaseStepForm from './StepForm.vue';
import IfThenElseWidget from '@/components/stepforms/widgets/IfThenElseWidget.vue';
import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
import type { IfThenElseStep, PipelineStepName } from '@/lib/steps';

export default defineComponent({
  name: 'ifthenelse-step-form',
  components: {
    IfThenElseWidget,
    InputTextWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<IfThenElseStep>,
      default: () => ({
        name: 'ifthenelse',
        newColumn: '',
        if: { column: '', value: '', operator: 'eq' },
        then: '',
        else: '',
      }),
    },
  },
  data() {
    return {
      stepname: 'ifthenelse' as PipelineStepName,
      title: 'Add a conditional column' as string,
      ifthenelse: _omit({ ...this.initialStepValue }, ['name', 'newColumn']),
      editedStep: {
        ...this.initialStepValue,
        ...this.stepFormDefaults,
      },
    };
  },
  computed: {
    duplicateColumnName() {
      if (this.columnNames.includes(this.editedStep.newColumn)) {
        return `A column name "${this.editedStep.newColumn}" already exists. You will overwrite it.`;
      } else {
        return null;
      }
    },
  },
  methods: {
    submit() {
      this.editedStep = {
        ...this.editedStep,
        ..._omit(this.editedStep, ['name', 'newColumn']),
      };
      this.$$super.submit();
    },
    updateIfThenElse(ifthenelse: Omit<IfThenElseStep, 'name' | 'newColumn'>) {
      this.editedStep = {
        ...this.editedStep,
        ...ifthenelse,
      };
      this.ifthenelse = ifthenelse;
    },
  },
});
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
