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
import { getTranslator } from '@/lib/translators';
import { VQBModule } from '@/store';

@StepFormComponent({
  vqbstep: 'custom',
  name: 'custom-step-form',
  components: { TextareaWidget },
})
export default class CustomStepForm extends BaseStepForm<CustomStep> {
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
