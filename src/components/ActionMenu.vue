<template>
  <popover :visible="visible" :align="alignLeft" bottom @closed="close">
    <div class="action-menu__body">
      <transition name="slide-left" mode="out-in">
        <div v-if="visiblePanel == 1">
          <div class="action-menu__section">
            <div class="action-menu__option" @click="createStep('rename')">Rename column</div>
            <div class="action-menu__option" @click="createStep('duplicate')">Duplicate column</div>
            <div class="action-menu__option" @click="createDeleteColumnStep">Delete column</div>
            <div
              class="action-menu__option action-menu__option--top-bordered"
              @click="visiblePanel = 2"
            >
              Other operations
            </div>
            <div style="border-top: 1px solid rgba(0, 0, 0, 0.1)">
              <ListUniqueValues :values="uniqueValues" @input="createOrUpdateFilterColumnStep" />
            </div>
          </div>
        </div>
      </transition>
      <transition name="slide-right" mode="out-in">
        <div v-if="visiblePanel == 2">
          <div class="action-menu__option--back" @click="visiblePanel = 1">
            <i class="fas fa-angle-left" /> BACK
          </div>
          <div
            class="action-menu__option action-menu__option--top-bordered"
            @click="createStep('filter')"
          >
            Filter values
          </div>
          <div class="action-menu__option" @click="createStep('fillna')">Fill null values</div>
          <div class="action-menu__option" @click="createStep('replace')">Replace values</div>
          <div class="action-menu__option" @click="createStep('sort')">Sort values</div>
          <div class="action-menu__option" @click="createUniqueGroupsStep">Get unique values</div>
        </div>
      </transition>
    </div>
  </popover>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import ListUniqueValues from '@/components/ListUniqueValues.vue';
import { DataSetColumn } from '@/lib/dataset';
import { AggFunctionStep, FilterStep, Pipeline, PipelineStep, PipelineStepName } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import { ColumnStat, ColumnValueStat } from '../lib/dataset/helpers';
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
  },
})
export default class ActionMenu extends Vue {
  @Prop({
    type: String,
    default: () => '',
  })
  columnName!: string;
  visiblePanel: VisiblePanel = 1;

  @VQBModule.State currentStepFormName!: string;
  @Prop({
    type: Boolean,
    default: true,
  })
  visible!: boolean;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter pipeline!: Pipeline;
  @VQBModule.Getter columnHeaders!: DataSetColumn[];

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];
  @VQBModule.Mutation closeStepForm!: () => void;
  @VQBModule.Mutation createStepForm!: ({
    stepName,
    stepFormDefaults,
  }: {
    stepName: PipelineStepName;
    stepFormDefaults?: object;
  }) => void;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  get columnHeader(): DataSetColumn | undefined {
    return this.columnHeaders.find(colHeader => {
      return colHeader.name === this.columnName;
    });
  }

  get uniqueValues(): ColumnValueStat[] {
    if (this.columnHeader && this.columnHeader.uniques) {
      return this.columnHeader.uniques.values;
    } else {
      return [];
    }
  }

  get isLoaded(): boolean {
    if (this.columnHeader && this.columnHeader.uniques) {
      return this.columnHeader.uniques.loaded;
    } else {
      return false;
    }
  }

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

  createOrUpdateFilterColumnStep(checkedValue: any[]) {
    this.$emit('actionClicked', 'filter', {
      name: 'filter',
      condition: { column: this.columnName, operator: 'in', value: checkedValue },
    });
    // console.log('checkedValue', checkedValue);
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    // else : create the filter step of edit it
    // if (!this.isEditingStep) {
    // create the step
    // const newPipeline: Pipeline = [...this.pipeline];
    // const index = this.computedActiveStepIndex + 1;
    const filterStep: FilterStep = {
      name: 'filter',
      condition: { column: this.columnName, operator: 'in', value: checkedValue },
    };
    this.createStepForm({ stepName: 'filter', stepFormDefaults: filterStep });
    // newPipeline.splice(index, 0, filterStep);
    // this.setPipeline({ pipeline: newPipeline });
    // this.selectStep({ index });
    // } else {
    //   console.log('allready open, to nothing');
    // }
  }
}
</script>
<style lang="scss">
@import '../styles/_variables';

.action-menu__body {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  margin-left: -5px;
  margin-right: -5px;
  width: 200px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
  overflow: hidden;
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
.action-menu__option--top-bordered {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  justify-content: space-between;
  position: relative;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: $active-color;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.action-menu__option--back {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  position: relative;
  font-weight: 600;

  &:last-child {
    margin-bottom: 0;
  }
}

.fa-angle-left {
  margin-right: 5px;
}

.slide-left-enter,
.slide-right-leave {
  transform: translateX(-100%);
  opacity: 0;
}

.slide-right-enter,
.slide-left-leave {
  transform: translateX(100%);
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
</style>
