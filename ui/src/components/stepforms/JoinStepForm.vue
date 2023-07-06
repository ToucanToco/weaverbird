<template>
  <div>
    <StepFormHeader
      :title="title"
      :stepName="editedStep.name"
      :version="version"
      :backendError="backendError"
    />
    <AutocompleteWidget
      class="rightPipelineInput"
      v-model="rightPipeline"
      name="Select a dataset to join (as right dataset):"
      :options="options"
      @input="updateRightColumnNames(rightPipeline.label)"
      placeholder="Select a dataset"
      data-path=".rightPipeline"
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
      :componentProps="{ syncWithSelectedColumn: false, rightColumnNames }"
      :automatic-new-field="false"
      data-path=".on"
      :errors="errors"
      unstyled-items
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import JoinStepFormSchema from '@/components/stepforms/schemas/join';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import JoinColumns from '@/components/stepforms/widgets/JoinColumns.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import {
  isReferenceToExternalQuery,
  type JoinStep,
  type PipelineStepName,
  type ReferenceToExternalQuery,
} from '@/lib/steps';
import { Action, State } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

import BaseStepForm from './StepForm.vue';
import Multiselect from './widgets/Multiselect.vue';

const joinTypes = JoinStepFormSchema.properties.type.enum as JoinStep['type'][];

interface DropdownOption {
  label: string;
  trackBy: string | ReferenceToExternalQuery;
  $isDisabled?: boolean;
  tooltip?: string;
}

@Component({
  name: 'join-step-form',
  components: {
    AutocompleteWidget,
    ListWidget,
    Multiselect,
  },
})
export default class JoinStepForm extends BaseStepForm<JoinStep> {
  stepname: PipelineStepName = 'join';

  @Prop({
    type: Object,
    default: () => ({ name: 'join', rightPipeline: '', type: joinTypes[0], on: [['', '']] }),
  })
  declare initialStepValue: JoinStep;

  @State(VQBModule) availableDomains!: { name: string; uid: string }[];
  @State(VQBModule) unjoinableDomains!: { name: string; uid: string }[];

  readonly title: string = 'Join datasets';
  joinColumns = JoinColumns;
  joinTypes: JoinStep['type'][] = joinTypes;

  get rightPipeline(): DropdownOption {
    const domain = this.editedStep.rightPipeline;
    if (isReferenceToExternalQuery(domain)) {
      return {
        label: this.availableDomains.find((d) => d.uid === domain.uid)?.name ?? domain.uid,
        trackBy: domain,
      };
    } else {
      return {
        label: this.editedStep.rightPipeline as string,
        trackBy: this.editedStep.rightPipeline as string,
      };
    }
  }

  set rightPipeline(value: DropdownOption) {
    /* istanbul ignore next */
    this.editedStep.rightPipeline = value.trackBy;
  }

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

  get options(): object[] {
    return this.availableDomains.map((d) => {
      const isDisabled = !!this.unjoinableDomains.find((domain) => domain.uid === d.uid);
      return {
        label: d.name,
        trackBy: { type: 'ref', uid: d.uid },
        ...(isDisabled && {
          disabled: true,
          tooltip: 'This dataset cannot be combined with the actual one',
        }),
      };
    });
  }

  rightColumnNames: string[] | null | undefined = null;

  @Action(VQBModule) getColumnNamesFromPipeline!: VQBActions['getColumnNamesFromPipeline'];

  async updateRightColumnNames(pipelineNameOrDomain: string) {
    this.rightColumnNames = await this.getColumnNamesFromPipeline(pipelineNameOrDomain);
  }

  created() {
    if (this.rightPipeline.label) {
      this.updateRightColumnNames(this.rightPipeline.label);
    }
  }
}
</script>
