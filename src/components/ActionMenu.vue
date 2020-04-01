<template>
  <popover :visible="visible" :align="alignLeft" bottom @closed="close">
    <div class="action-menu__body">
      <div class="action-menu__section">
        <div class="action-menu__option" @click="createStep('duplicate')">Duplicate column</div>
        <div class="action-menu__option" @click="createStep('rename')">Rename column</div>
        <div class="action-menu__option" @click="createDeleteColumnStep">Delete column</div>
        <div class="action-menu__option" @click="createStep('filter')">Filter values</div>
        <div class="action-menu__option" @click="createStep('fillna')">Fill null values</div>
        <div class="action-menu__option" @click="createStep('replace')">Replace values</div>
        <div class="action-menu__option" @click="createStep('sort')">Sort values</div>
        <div class="action-menu__option" @click="createUniqueGroupsStep">Get unique values</div>
      </div>
    </div>
  </popover>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import { Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import Popover from './Popover.vue';

@Component({
  name: 'action-menu',
  components: {
    Popover,
  },
})
export default class ActionMenu extends Vue {
  @Prop({
    type: String,
    default: () => '',
  })
  columnName!: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  visible!: boolean;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter pipeline!: Pipeline;

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];
  @VQBModule.Mutation closeStepForm!: () => void;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  close() {
    this.$emit('closed');
  }

  createDeleteColumnStep() {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const deletecolumnStep: PipelineStep = { name: 'delete', columns: [this.columnName] };
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, deletecolumnStep);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
  }

  createStep(stepName: PipelineStepName) {
    this.$emit('actionClicked', stepName);
    this.close();
  }

  createUniqueGroupsStep() {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const uniquegroupsStep: PipelineStep = { name: 'uniquegroups', on: [this.columnName] };
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, uniquegroupsStep);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
  }
}
</script>
<style lang="scss">
@import '../styles/_variables';

.action-menu__body {
  display: flex;
  flex-direction: column;
  border-radius: 3px;
  margin-left: -5px;
  margin-right: -5px;
  width: 200px;
  background-color: #fff;
  box-shadow: 0px 1px 20px 0px rgba(0, 0, 0, 0.2);
  color: $base-color;
}

.action-menu__section {
  display: flex;
  flex-direction: column;
  border-color: $data-viewer-border-color;

  &:not(:last-child) {
    border-bottom-style: solid;
    border-bottom-width: 1px;
  }
}

.action-menu__option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  justify-content: space-between;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: $active-color;
  }

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
