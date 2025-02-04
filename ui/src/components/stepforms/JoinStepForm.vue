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
      @input="updateRightColumnNames(rightPipeline.trackBy)"
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
      :columnNames="columnNames"
      :selectedColumns="selectedColumns"
      @setSelectedColumns="setSelectedColumns"
    />
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import JoinStepFormSchema from '@/components/stepforms/schemas/join';
import JoinColumns from '@/components/stepforms/widgets/JoinColumns.vue';
import ListWidget from '@/components/stepforms/widgets/List.vue';
import {
  isReferenceToExternalQuery,
  type JoinStep,
  type PipelineStepName,
  type ReferenceToExternalQuery,
} from '@/lib/steps';
import BaseStepForm from './StepForm.vue';

const joinTypes = JoinStepFormSchema.properties.type.enum as JoinStep['type'][];

interface DropdownOption {
  label: string;
  trackBy: string | ReferenceToExternalQuery;
  $isDisabled?: boolean;
  tooltip?: string;
}

export default defineComponent({
  name: 'join-step-form',
  components: {
    AutocompleteWidget,
    ListWidget,
  },
  extends: BaseStepForm,
  props: {
    initialStepValue: {
      type: Object as PropType<JoinStep>,
      default: () => ({ name: 'join', rightPipeline: '', type: joinTypes[0], on: [['', '']] }),
    },
  },
  data() {
    return {
      stepname: 'join' as PipelineStepName,
      title: 'Join datasets',
      joinColumns: JoinColumns,
      joinTypes: joinTypes,
      rightColumnNames: null as string[] | null | undefined,
    };
  },
  computed: {
    rightPipeline: {
      get(): DropdownOption {
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
      },
      set(value: DropdownOption) {
        /* istanbul ignore next */
        this.editedStep.rightPipeline = value.trackBy;
      }
    },
    on: {
      get() {
        if (this.editedStep.on.length) {
          return this.editedStep.on;
        } else {
          return [[]];
        }
      },
      set(newval) {
        this.editedStep.on = [...newval];
      }
    },
    options(): object[] {
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
    },
  },
  methods: {
    async updateRightColumnNames(pipelineNameOrDomain: string | ReferenceToExternalQuery) {
      this.rightColumnNames = await this.getColumnNamesFromPipeline(pipelineNameOrDomain);
    },
  },
  created() {
    if (this.rightPipeline.trackBy) {
      this.updateRightColumnNames(this.rightPipeline.trackBy);
    }
  },
});
</script>
