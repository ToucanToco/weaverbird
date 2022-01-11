<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <label>
      Please write you SQL query by referring to the result of the previous step. Refer to the
      previous step using the <strong>##PREVIOUS_STEP##</strong> keyword
    </label>
    <CodeEditorWidget
      v-model="editedStep.query"
      placeholder="Write your custom Sql here"
      :errors="errors"
      data-path=".query"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { CustomSqlStep, PipelineStepName } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';

import BaseStepForm from './StepForm.vue';
import CodeEditorWidget from './widgets/CodeEditorWidget.vue';

@Component({
  name: 'custom-sql-step-form',
  components: { CodeEditorWidget },
})
export default class CustomSqlStepForm extends BaseStepForm<CustomSqlStep> {
  stepname: PipelineStepName = 'customsql';

  @Prop({
    type: Object,
    default: () => ({ name: 'customsql', query: 'SELECT * FROM ##PREVIOUS_STEP##' }),
  })
  initialStepValue!: CustomSqlStep;

  readonly title: string = 'Custom Sql step';

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    return getTranslator('snowflake').validate({ ...this.editedStep });
  }
}
</script>
