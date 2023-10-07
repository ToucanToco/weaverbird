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
        v-model="editedStep.column"
        name="Duration column:"
        :options="columnNames"
        placeholder="Pick a column"
        data-path=".column"
        :errors="errors"
      />
      <MultiselectWidget
        class="durationInfoInput"
        name="Duration information to extract:"
        :value="currentDurationInfo"
        @input="updateCurrentDurationInfo"
        :options="durationInfo"
        :trackBy="`info`"
        :label="`label`"
        placeholder="Select one or several"
        data-path=".durationInfo"
        :errors="errors"
      />
      <StepFormButtonbar />
    </div>
  </template>
  
  <script lang="ts">
  import Component from 'vue-class-component';
  import { Prop } from 'vue-property-decorator';
  import type { PropOptions } from 'vue';
  
  import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
  import InputTextWidget from '@/components/stepforms/widgets/InputText.vue';
  import MultiselectWidget from '@/components/stepforms/widgets/Multiselect.vue';
  import { generateNewColumnName } from '@/lib/helpers';
  import type { DurationExtractStep, DurationInfo, PipelineStepName } from '@/lib/steps';
  
  import BaseStepForm from './StepForm.vue';
  
  type DurationInfoOption = {
    info: DurationInfo;
    label: string;
  };
  
  @Component({
    name: 'durationextract-step-form',
    components: {
      ColumnPicker,
      InputTextWidget,
      MultiselectWidget,
    },
  })
  export default class DurationExtractStepForm extends BaseStepForm<DurationExtractStep> {
    stepname: PipelineStepName = 'durationextract';
  
    @Prop({
      type: Object,
      default: () => ({ name: 'durationextract', column: '', durationInfo: [], newColumns: [] } as PropOptions<DurationExtractStep>),
    })
    declare initialStepValue: DurationExtractStep;

    readonly title: string = 'Extract Duration Information';
  
    readonly durationInfo: DurationInfoOption[] = [
      { info: 'days', label: 'days' },
      { info: 'hours', label: 'hours'},
      { info: 'minutes', label: 'minutes' },
      { info: 'seconds', label: 'seconds' },
      { info: 'milliseconds', label: 'milliseconds' },
      { info: 'total_days', label: 'total days'},
      { info: 'total_hours', label: 'total hours' },
      { info: 'total_minutes', label: 'total minutes' },
      { info: 'total_seconds', label: 'total seconds' },
      { info: 'total_milliseconds', label: 'total milliseconds'},
    ];
  
    get currentDurationInfo(): DurationInfoOption[] {
      return this.durationInfo.filter((d) => this.editedStep.durationInfo.includes(d.info));
    }
  
    updateCurrentDurationInfo(options: DurationInfoOption[]) {
      this.editedStep.durationInfo = [...options.map((o) => o.info)];
    }
  
    submit() {
      // populate the newColumns field with automatic, safe column names
      this.editedStep.newColumns = this.editedStep.durationInfo.map((d) =>
        generateNewColumnName(`${this.editedStep.column}_${d}`, this.columnNames),
      );
      this.$$super.submit();
    }
  }
  </script>
  