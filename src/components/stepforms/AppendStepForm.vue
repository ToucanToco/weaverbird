<template>
  <div>
    <step-form-title :title="title" />
    <MultiselectWidget
      id="pipelinesInput"
      v-model="editedStep.pipelines"
      name="Select datasets to append:"
      :options="pipelines"
      placeholder="Select datasets"
      data-path=".pipelines"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';
import { AppendStepByRef } from '@/lib/steps';
import MultiselectWidget from './widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';
import { StepFormComponent } from '@/components/formlib';
import { VQBModule } from '@/store';
import { Pipeline } from '@/lib/steps';

@StepFormComponent({
  vqbstep: 'append',
  name: 'append-step-form',
  components: {
    MultiselectWidget,
  },
})
export default class AppendStepForm extends BaseStepForm<AppendStepByRef> {
  @Prop({ type: Object, default: () => ({ name: 'append', pipelines: [] }) })
  initialStepValue!: AppendStepByRef;

  @VQBModule.State pipelines!: { [k: string]: Pipeline };

  readonly title: string = 'Append datasets';

  submit() {
    const errors = this.validate();
    this.errors = errors;
    if (errors === null) {
      this.$emit('formSaved', {
        name: 'append',
        pipelines: [this.pipeline, this.editedStep.pipelines.map(p => this.pipelines[p])],
      });
    }
  }
}
</script>
