<template>
  <div>
    <StepFormHeader :title="title" :stepName="this.editedStep.name" />
    <AutocompleteWidget
      class="rightPipelineInput"
      v-model="editedStep.right_pipeline"
      name="Select a dataset to join (as right dataset):"
      :options="options"
      placeholder="Select a dataset"
      data-path=".right_pipeline"
      :errors="errors"
      track-by="trackBy"
      label="label"
      with-example
    />
    <AutocompleteWidget
      class="typeInput"
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
      class="joinColumns"
      v-model="on"
      :defaultItem="['', '']"
      :widget="joinColumns"
      :componentProps="{ syncWithSelectedColumn: false }"
      :automatic-new-field="false"
      data-path=".on"
      :errors="errors"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { Prop } from 'vue-property-decorator';

import { StepFormComponent } from '@/components/formlib';
import JoinStepFormSchema from '@/components/stepforms/schemas/join.ts';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import JoinColumns from '@/components/stepforms/widgets/JoinColumns.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import { JoinStep } from '@/lib/steps';
import { VQBModule } from '@/store';

import BaseStepForm from './StepForm.vue';
import Multiselect from './widgets/Multiselect.vue';

const joinTypes = JoinStepFormSchema.properties.type.enum;

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
    default: () => ({ name: 'join', right_pipeline: '', type: joinTypes[0], on: [['', '']] }),
  })
  initialStepValue!: JoinStep;

  @VQBModule.Getter referencingPipelines!: string[];
  @VQBModule.Getter availablePipelines!: string[];
  @VQBModule.State domains!: string[];

  readonly title: string = 'Join datasets';
  joinColumns = JoinColumns;
  joinTypes: JoinStep['type'][] = joinTypes;

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

  get options() {
    return [...this.availablePipelines, ...this.domains].map(name => {
      const option = { label: name, trackBy: name };
      if (this.referencingPipelines.includes(name)) {
        option['$isDisabled'] = true;
        option['tooltip'] = 'This dataset is not available for jointure.';
      }
      return option;
    });
  }
}
</script>
