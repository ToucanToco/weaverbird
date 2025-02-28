<template>
  <popover :visible="visible" :align="alignLeft" bottom @closed="close">
    <div class="action-menu__body">
      <transition name="slide-left" mode="out-in">
        <div v-if="visiblePanel == 1">
          <div class="action-menu__panel">
            <action-menu-option
              label="Rename column"
              :isDisabled="isDisabled('rename')"
              @actionClicked="openStep('rename')"
            />
            <action-menu-option
              label="Duplicate column"
              :isDisabled="isDisabled('duplicate')"
              @actionClicked="openStep('duplicate')"
            />
            <action-menu-option
              :isDisabled="isDisabled('delete')"
              label="Delete column"
              @actionClicked="createDeleteColumnStep"
            />
            <action-menu-option
              class="action-menu__option--top-bordered"
              label="Other operations"
              @actionClicked="visiblePanel = 2"
            />
            <div
              class="action-menu__option--top-bordered"
              v-if="!isDisabled('filter') && !isDisabled('uniquegroups')"
            >
              <ListUniqueValues
                v-if="currentUnique"
                :columnName="columnName"
                :options="currentUnique.values"
                :filter="condition"
                :loaded="currentUnique.loaded"
                @input="condition = $event"
              />
              <div
                v-if="isApplyFilterVisible"
                class="action-menu__apply-filter"
                @click="createFilterStep"
              >
                Apply Filter
              </div>
            </div>
          </div>
        </div>
      </transition>
      <transition name="slide-right" mode="out-in">
        <div v-if="visiblePanel == 2">
          <div class="action-menu__panel">
            <div class="action-menu__option--back" @click="visiblePanel = 1">
              <FAIcon class="action-menu__option__back-icon" icon="angle-left" /> BACK
            </div>
            <action-menu-option
              class="action-menu__option--top-bordered"
              :isDisabled="isDisabled('filter')"
              label="Filter values"
              @actionClicked="openStep('filter')"
            />
            <action-menu-option
              :isDisabled="isDisabled('top')"
              label="Top N values"
              @actionClicked="openStep('top')"
            />
            <action-menu-option
              :isDisabled="isDisabled('fillna')"
              label="Fill null values"
              @actionClicked="openStep('fillna')"
            />
            <action-menu-option
              :isDisabled="isDisabled('replace')"
              label="Replace values"
              @actionClicked="openStep('replace')"
            />
            <action-menu-option
              :isDisabled="isDisabled('sort')"
              label="Sort values"
              @actionClicked="openStep('sort')"
            />
            <action-menu-option
              :isDisabled="isDisabled('trim')"
              label="Trim spaces"
              @actionClicked="openStep('trim')"
            />
            <action-menu-option
              :isDisabled="isDisabled('uniquegroups')"
              label="Get unique values"
              @actionClicked="createUniqueGroupsStep"
            />
            <action-menu-option
              :isDisabled="isDisabled('statistics')"
              label="Compute Statistics"
              @actionClicked="openStep('statistics')"
            />
          </div>
        </div>
      </transition>
    </div>
  </popover>
</template>
<script lang="ts">
import _isEqual from 'lodash/isEqual';
import { defineComponent, PropType } from 'vue';
import { mapActions, mapGetters, mapState } from 'pinia';

import { POPOVER_ALIGN } from '@/components/constants';
import FAIcon from '@/components/FAIcon.vue';
import ListUniqueValues from '@/components/ListUniqueValues.vue';
import type { DataSetColumn } from '@/lib/dataset';
import type {
  FilterConditionInclusion,
  Pipeline,
  PipelineStep,
  PipelineStepName,
} from '@/lib/steps';
import { VQBModule } from '@/store';

import ActionMenuOption from './ActionMenuOption.vue';
import Popover from './Popover.vue';

enum VisiblePanel {
  'MAIN OPERATIONS',
  'OTHER OPERATIONS',
}

export default defineComponent({
  name: 'action-menu',
  
  components: {
    Popover,
    ListUniqueValues,
    FAIcon,
    ActionMenuOption,
  },
  
  props: {
    columnName: {
      type: String,
      default: '',
    },
    visible: {
      type: Boolean,
      default: true,
    },
  },
  
  data() {
    return {
      visiblePanel: 1 as VisiblePanel,
      alignLeft: POPOVER_ALIGN.LEFT,
      condition: { 
        column: this.columnName, 
        value: [], 
        operator: 'nin' 
      } as FilterConditionInclusion,
    };
  },
  
  computed: {
    ...mapGetters(VQBModule, [
      'computedActiveStepIndex',
      'isEditingStep',
      'pipeline',
      'columnHeaders',
      'unsupportedSteps',
    ]),
    
    currentUnique() {
      return (
        this.columnHeaders.find((hdr) => hdr.name === this.columnName) as DataSetColumn | undefined
      )?.uniques;
    },
    
    isDisabled() {
      return (stepName: PipelineStepName): boolean => this.unsupportedSteps.includes(stepName);
    },
    
    isApplyFilterVisible() {
      return !_isEqual(this.condition, { column: this.columnName, value: [], operator: 'nin' });
    }
  },
  
  methods: {
    ...mapActions(VQBModule, [
      'selectStep',
      'setPipeline',
      'closeStepForm',
    ]),
    
    close() {
      this.visiblePanel = 1;
      this.$emit('closed');
    },
    
    openStep(stepName: PipelineStepName) {
      this.$emit('actionClicked', stepName);
      this.close();
    },
    
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
    },
    
    createDeleteColumnStep() {
      this.createStep({ name: 'delete', columns: [this.columnName] });
    },
    
    createUniqueGroupsStep() {
      this.createStep({ name: 'uniquegroups', on: [this.columnName] });
    },
    
    createFilterStep() {
      this.createStep({ name: 'filter', condition: { ...this.condition, column: this.columnName } });
    }
  }
});
</script>
<style lang="scss">
@import '../styles/_variables';

.action-menu__body {
  display: flex;
  border-radius: 10px;
  margin-left: -5px;
  margin-right: -5px;
  width: 200px;
  background-color: #fff;
  box-shadow: 0 2px 10px 0 rgba(0, 0, 0, 0.25);
  color: $base-color;
}

.action-menu__panel {
  display: flex;
  width: 200px;
  flex-direction: column;
  border-color: $data-viewer-border-color;

  &:not(:last-child) {
    border-bottom-style: solid;
    border-bottom-width: 1px;
  }
}

.action-menu__option--top-bordered {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
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

.action-menu__option__back-icon {
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
