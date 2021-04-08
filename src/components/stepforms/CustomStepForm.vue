<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <label v-if="name">{{ name }}</label>
    <CodeEditorWidget
      v-model="editedStep.query"
      placeholder="Write your custom mongo here"
      :errors="errors"
      data-path=".query"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { CustomStep, PipelineStepName } from '@/lib/steps';
import { getTranslator } from '@/lib/translators';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import CodeEditorWidget from './widgets/CodeEditorWidget.vue';

@Component({
  name: 'custom-step-form',
  components: { CodeEditorWidget },
})
export default class CustomStepForm extends BaseStepForm<CustomStep> {
  stepname: PipelineStepName = 'custom';

  @VQBModule.Getter translator!: string;
  @Prop({
    type: Object,
    default: () => ({ name: 'custom', query: '[{"$match": {"domain": "test"}}]' }),
  })
  initialStepValue!: CustomStep;

  readonly title: string = 'Custom step';
  get name() {
    return `Write a custom ${getTranslator(this.translator).constructor.label} query`;
  }

  validate() {
    const errors = this.$$super.validate();
    if (errors !== null) {
      return errors;
    }
    const translatorErrors = getTranslator(this.translator).validate({ ...this.editedStep });
    return translatorErrors;
  }
}
</script>
