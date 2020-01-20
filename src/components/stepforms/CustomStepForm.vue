<template>
  <div>
    <step-form-header :cancel="cancelEdition" :title="title" :stepName="this.editedStep.name" />
    <label v-if="name">{{ name }}</label>
    <TextareaWidget
      v-model="editedStep.query"
      placeholder="Write your custom mongo here"
      :errors="errors"
      data-path=".query"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { StepFormComponent } from '@/components/formlib';
import BaseStepForm from './StepForm.vue';
import { CustomStep } from '@/lib/steps';
import TextareaWidget from './widgets/TextareaWidget.vue';
import MonacoEditorWidget from './widgets/MonacoEditorWidget.vue';
import capitalize from 'lodash/capitalize'

@StepFormComponent({
  vqbstep: 'custom',
  name: 'custom-step-form',
  components:{ TextareaWidget, MonacoEditorWidget}
})
export default class CustomStepForm extends BaseStepForm<CustomStep> {
  @Prop({ type: Object, default: () => ({ name: 'custom', query: "[{\"$match\": {\"domain\": \"test\"}}]" }) })
  initialStepValue!: CustomStep;

  readonly title: string = 'Custom step';
  name = `Write a custom ${capitalize(this.$store.getters['vqb/translator'])} query`;
}
</script>
