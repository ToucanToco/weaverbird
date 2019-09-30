<template>
  <popover :active="isActive" :align="alignLeft" bottom>
    <div class="action-menu__body">
      <div class="action-menu__section">
        <div class="action-menu__option" @click="createDuplicateColumnStep">Duplicate column</div>
        <div class="action-menu__option" @click="createStep('rename')">Rename column</div>
        <div class="action-menu__option" @click="createDeleteColumnStep">Delete column</div>
        <div class="action-menu__option" @click="createStep('fillna')">Fill null values</div>
        <div class="action-menu__option" @click="createStep('replace')">Replace values</div>
        <div class="action-menu__option" @click="createStep('filter')">Filter values</div>
        <div class="action-menu__option" @click="createStep('sort')">Sort values</div>
      </div>
    </div>
  </popover>
</template>
<script lang="ts">
import { VQBModule } from '@/store';
import { Vue, Component, Prop, Watch } from 'vue-property-decorator';
import { POPOVER_ALIGN } from '@/components/constants';
import Popover from './Popover.vue';
import { Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { MutationCallbacks } from '@/store/mutations';
import { newColumnName } from '@/lib/helpers';

@Component({
  name: 'action-menu',
  components: {
    Popover,
  },
})
export default class ActionMenu extends Vue {
  @Prop({
    type: Boolean,
    default: () => false,
  })
  isActive!: boolean;

  @Prop({
    type: String,
    default: () => '',
  })
  columnName!: string;

  @VQBModule.State pipeline!: Pipeline;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter columnNames!: string[];

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];
  @VQBModule.Mutation closeStepForm!: () => void;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  /**
   * @description Close the popover when clicking outside
   */
  clickListener(e: Event) {
    const target = e.target as HTMLElement;
    const hasClickOnItSelf = target === this.$el || this.$el.contains(target);

    if (!hasClickOnItSelf) {
      this.close();
    }
  }

  close() {
    this.$emit('closed');
  }

  createDeleteColumnStep() {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const deleteColumnStep: PipelineStep = { name: 'delete', columns: [this.columnName] };
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, deleteColumnStep);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
  }

  createDuplicateColumnStep() {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const duplicateColumnStep: PipelineStep = {
      name: 'duplicate',
      column: this.columnName,
      new_column_name: newColumnName(`${this.columnName}_copy`, this.columnNames),
    };
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, duplicateColumnStep);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
  }

  createStep(stepName: PipelineStepName) {
    this.$emit('actionClicked', stepName);
    this.close();
  }

  @Watch('isActive')
  onIsActiveChanged(val: boolean) {
    if (val) {
      window.addEventListener('click', this.clickListener);
    } else {
      window.removeEventListener('click', this.clickListener);
    }
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
  }

  &:last-child {
    margin-bottom: 0;
  }
}
</style>
