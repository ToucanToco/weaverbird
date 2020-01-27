<template>
  <div>
    <step-form-header :cancel="cancelEdition" :title="title" :stepName="this.editedStep.name" />
    <AutocompleteWidget
      id="rightPipelineInput"
      v-model="editedStep.right_pipeline"
      name="Select a dataset to join (as right dataset):"
      :options="Object.keys(pipelines).filter(p => p !== currentPipelineName)"
      placeholder="Select a dataset"
      data-path=".right_pipeline"
      :errors="errors"
    />
    <AutocompleteWidget
      id="typeInput"
      v-model="editedStep.type"
      name="Select a join type:"
      :options="joinTypes"
      placeholder="Select a join type"
      data-path=".type"
      :errors="errors"
    />
    <ListWidget
      addFieldName="Add columns"
      name="Join based on column(s):"
      id="joinColumns"
      v-model="on"
      :defaultItem="['', '']"
      :widget="joinColumns"
      :componentProps="{ syncWithSelectedColumn: false }"
      :automatic-new-field="false"
      data-path=".on"
      :errors="errors"
    />
    <step-form-buttonbar :cancel="cancelEdition" :submit="submit" />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import JoinColumns from '@/components/stepforms/widgets/JoinColumns.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import { JoinStep, Pipeline } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import Multiselect from './widgets/Multiselect.vue';

@StepFormComponent({
  vqbstep: 'join',
  name: 'join-step-form',
  components: {
    AutocompleteWidget,
    ListWidget,
    Multiselect,
  },
})
export default class JoinStepForm extends BaseStepForm<JoinStep> {
  @Prop({
    type: Object,
    default: () => ({ name: 'join', right_pipeline: '', type: 'left', on: [['', '']] }),
  })
  initialStepValue!: JoinStep;

  @VQBModule.State currentPipelineName!: string;
  @VQBModule.State pipelines!: { [k: string]: Pipeline };

  readonly title: string = 'Join datasets';
  joinColumns = JoinColumns;
  joinTypes: JoinStep['type'][] = ['left', 'inner', 'left outer'];

  get on() {
    if (this.editedStep.on.length) {
      return this.editedStep.on;
    } else {
      return [[]];
    }
  }

  set on(newval) {
    this.editedStep.on = [...newval];
  }
}
</script>
