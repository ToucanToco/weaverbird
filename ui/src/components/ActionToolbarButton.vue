<template>
  <button type="button" class="action-toolbar__btn" data-cy="weaverbird-action-menu">
    <FAIcon class="action-toolbar__btn-icon" :icon="icon" />
    <span class="action-toolbar__btn-txt">{{ label }}</span>
    <popover :visible="isActive" :align="'left'" bottom @closed="$emit('closed')">
      <div class="action-menu__body">
        <div class="action-menu__section">
          <action-menu-option
            v-for="(item, index) in items"
            :key="index"
            :label="item.label"
            :isDisabled="isDisabled(item.name)"
            @actionClicked="actionClicked(item.name, item.defaults)"
          />
        </div>
      </div>
    </popover>
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { mapActions, mapGetters, mapState } from 'pinia';

import {
  ACTION_CATEGORIES,
  PipelineStepCategory,
  POPOVER_ALIGN,
  STEP_LABELS,
} from '@/components/constants';
import FAIcon from '@/components/FAIcon.vue';
import type * as S from '@/lib/steps';
import { VQBModule } from '@/store';

import ActionMenuOption from './ActionMenuOption.vue';
import Popover from './Popover.vue';

/**
 * all steps that don't require form creation
 */
type NoFormStep = S.DateExtractStep | S.ToLowerStep | S.ToDateStep | S.ToUpperStep;

export default defineComponent({
  name: 'action-toolbar-button',
  
  components: {
    Popover,
    FAIcon,
    ActionMenuOption,
  },
  
  props: {
    label: String,
    icon: String,
    isActive: {
      type: Boolean,
      default: false
    },
    category: {
      type: String as PropType<PipelineStepCategory>,
      required: true
    }
  },
  
  data() {
    return {
      alignLeft: POPOVER_ALIGN.LEFT
    };
  },
  
  computed: {
    ...mapGetters(VQBModule, [
      'computedActiveStepIndex',
      'isEditingStep',
      'pipeline',
      'unsupportedSteps'
    ]),
    
    ...mapState(VQBModule, [
      'selectedColumns'
    ]),
    
    isDisabled() {
      return (stepName: S.PipelineStepName) => this.unsupportedSteps.includes(stepName);
    },
    
    // Filter out unsupported steps
    items() {
      return ACTION_CATEGORIES[this.category].map((name) => ({ name, label: STEP_LABELS[name] }));
    }
  },
  
  methods: {
    ...mapActions(VQBModule, [
      'selectStep',
      'setPipeline',
      'closeStepForm'
    ]),
    
    /**
     * @description Emit an event with a PipelineStepName in order to open its form
     */
    actionClicked(stepName: S.PipelineStepName, defaults = {}) {
      if ((stepName === 'lowercase' || stepName === 'uppercase') && this.selectedColumns.length > 0) {
        this.createStep(stepName, defaults);
      } else {
        this.$emit('actionClicked', stepName, defaults);
      }
      this.$emit('closed');
    },
    
    createStep(stepName: NoFormStep['name'], defaults: { [prop: string]: any } = {}) {
      const newPipeline: S.Pipeline = [...this.pipeline];
      const index = this.computedActiveStepIndex + 1;
      const step = { name: stepName, column: this.selectedColumns[0], ...defaults };
      /**
       * If a step edition form is already open, close it so that the left panel displays
       * the pipeline with the new delete step inserted
       */
      if (this.isEditingStep) {
        this.closeStepForm();
      }
      newPipeline.splice(index, 0, step as S.PipelineStep);
      this.setPipeline({ pipeline: newPipeline });
      this.selectStep({ index });
    }
  }
});
</script>
<style lang="scss">
@import '../styles/_variables';

.action-toolbar__btn {
  background: #fafafa;
  border-radius: 5px;
  border: 1px solid #fafafa;
  color: $active-color;
  padding: 10px 0;
  text-align: center;
  margin-left: 5px;
  width: 75px;
  transition: all ease-in-out 100ms;
  cursor: pointer;
  &:focus {
    outline: none;
  }
  &:hover {
    background: #f4f7fa;
  }
}

.action-toolbar__btn--active {
  background: $active-color;
  color: #fff;
  &:hover {
    background: $active-color;
    color: #fff;
  }
}

.action-toolbar__btn--disable {
  color: #d5d5d5;
  cursor: default;
  &:hover {
    background: #fafafa;
    color: #d5d5d5;
  }
}

.action-toolbar__btn--special {
  background: none;
  border: 1px dashed #999999;
  color: #999999;
  margin-left: 0;
  &:hover {
    border-color: transparent;
  }
}

.action-toolbar__btn-icon {
  font-size: 18px;
  margin-bottom: 6px;
}

.action-toolbar__btn-txt {
  display: block;
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
}

.action-menu__section {
  width: 100%;
}
</style>
