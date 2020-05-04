<template>
  <Menu :visible="visible" @closed="close" :buttons="firstPanel" :other-buttons="secondPanel">
    <template v-slot:first-panel-special>
      <ListUniqueValues
        v-if="currentUnique"
        :options="currentUnique.values"
        :filter="condition"
        :loaded="currentUnique.loaded"
        @input="condition = $event"
      />
      <div v-if="isApplyFilterVisible" class="action-menu__apply-filter" @click="createFilterStep">
        Apply Filter
      </div>
    </template>
  </Menu>
</template>
<script lang="ts">
import _isEqual from 'lodash/isEqual';
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import ListUniqueValues from '@/components/ListUniqueValues.vue';
import Menu, { ButtonsList } from '@/components/Menu.vue';
import { DataSetColumn } from '@/lib/dataset/index.ts';
import { FilterConditionInclusion, Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import Popover from './Popover.vue';

enum VisiblePanel {
  'MAIN OPERATIONS',
  'OTHER OPERATIONS',
}

@Component({
  name: 'action-menu',
  components: {
    Popover,
    ListUniqueValues,
    Menu,
  },
})
export default class ActionMenu extends Vue {
  @Prop({
    type: String,
    default: () => '',
  })
  columnName!: string;
  visiblePanel: VisiblePanel = 1;

  @Prop({
    type: Boolean,
    default: true,
  })
  visible!: boolean;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter pipeline!: Pipeline;
  @VQBModule.Getter columnHeaders!: Pipeline;

  get currentUnique() {
    return (this.columnHeaders.find(hdr => hdr.name === this.columnName) as DataSetColumn).uniques;
  }

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];
  @VQBModule.Mutation closeStepForm!: () => void;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  condition: FilterConditionInclusion = { column: this.columnName, value: [], operator: 'nin' };

  get isApplyFilterVisible() {
    return !_isEqual(this.condition, { column: this.columnName, value: [], operator: 'nin' });
  }

  close() {
    this.$emit('closed');
  }

  openStep(stepName: PipelineStepName) {
    this.$emit('actionClicked', stepName);
    this.close();
  }

  createStep(newStepForm: PipelineStep) {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, newStepForm);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
  }

  createDeleteColumnStep() {
    this.createStep({ name: 'delete', columns: [this.columnName] });
  }

  createUniqueGroupsStep() {
    this.createStep({ name: 'uniquegroups', on: [this.columnName] });
  }

  createFilterStep() {
    this.createStep({ name: 'filter', condition: this.condition });
  }

  readonly firstPanel: ButtonsList = [
    {
      html: 'Rename column',
      onclick: () => this.openStep('rename'),
    },
    {
      html: 'Duplicate column',
      onclick: () => this.openStep('duplicate'),
    },
    {
      html: 'Delete column',
      onclick: () => this.createDeleteColumnStep(),
    },
  ];

  readonly secondPanel: ButtonsList = [
    {
      html: 'Filter values',
      onclick: () => this.openStep('filter'),
    },
    {
      html: 'Fill null values',
      onclick: () => this.openStep('fillna'),
    },
    {
      html: 'Replace values',
      onclick: () => this.openStep('replace'),
    },
    {
      html: 'Sort values',
      onclick: () => this.openStep('sort'),
    },
    {
      html: 'Get unique values',
      onclick: () => this.createUniqueGroupsStep(),
    },
  ];
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables';

.action-menu__apply-filter {
  font-size: 12px;
  text-align: center;
  padding: 12px 0px;
  cursor: pointer;
  text-transform: uppercase;
  color: white;
  background-color: $active-color;
}
</style>
