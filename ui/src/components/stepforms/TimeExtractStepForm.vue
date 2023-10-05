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
        name="Time column:"
        :options="columnNames"
        placeholder="Pick a column"
        data-path=".column"
        :errors="errors"
      />
      <MultiselectWidget
        class="timeInfoInput"
        name="Time information to extract:"
        :value="currentTimeInfo"
        @input="updateCurrentTimeInfo"
        :options="timeInfo"
        :trackBy="`info`"
        :label="`label`"
        placeholder="Select one or several"
        data-path=".timeInfo"
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
  import type { TimeExtractStep, TimeInfo, PipelineStepName } from '@/lib/steps';
  
  import BaseStepForm from './StepForm.vue';
  
  type TimeInfoOption = {
    info: TimeInfo;
    label: string;
  };
  
  @Component({
    name: 'timeextract-step-form',
    components: {
      ColumnPicker,
      InputTextWidget,
      MultiselectWidget,
    },
  })
  export default class TimeExtractStepForm extends BaseStepForm<TimeExtractStep> {
    stepname: PipelineStepName = 'timeextract';
  
    @Prop({
      type: Object,
      default: () => ({ name: 'timeextract', column: '', timeInfo: [], newColumns: [] } as PropOptions<TimeExtractStep>),
    })
    declare initialStepValue: TimeExtractStep;

    readonly title: string = 'Extract Time Information';
  
    readonly timeInfo: TimeInfoOption[] = [
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
  
    get currentTimeInfo(): TimeInfoOption[] {
      return this.timeInfo.filter((d) => this.editedStep.timeInfo.includes(d.info));
    }
  
    updateCurrentTimeInfo(options: TimeInfoOption[]) {
      this.editedStep.timeInfo = [...options.map((o) => o.info)];
    }
  
    submit() {
      // populate the newColumns field with automatic, safe column names
      this.editedStep.newColumns = this.editedStep.timeInfo.map((d) =>
        generateNewColumnName(`${this.editedStep.column}_${d}`, this.columnNames),
      );
      this.$$super.submit();
    }
  }
  </script>
  