<template>
  <button type="button" class="action-toolbar__btn">
    <i :class="`action-toolbar__btn-icon fas fa-${icon}`" />
    <span class="action-toolbar__btn-txt">{{ label }}</span>
    <popover :active="isActive" :align="'left'" bottom>
      <div class="action-menu__body">
        <div class="action-menu__section">
          <div
            v-for="(item, index) in items"
            :key="index"
            class="action-menu__option"
            @click="actionClicked(item.name)"
          >{{ item.label }}</div>
        </div>
      </div>
    </popover>
  </button>
</template>

<script lang="ts">
import Vue from 'vue';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';
import { Component, Prop, Watch } from 'vue-property-decorator';
import * as S from '@/lib/steps';
import { ACTION_CATEGORIES, POPOVER_ALIGN } from '@/components/constants';
import Popover from './Popover.vue';

/**
 * all steps that don't require form creation
 */
type NoFormStep = S.ToLowerStep | S.ToDateStep | S.ToUpperStep;

@Component({
  name: 'action-toolbar-button',
  components: {
    Popover,
  },
  props: {
    label: String,
    icon: String,
  },
})
export default class ActionToolbarButton extends Vue {
  @Prop({
    type: Boolean,
    default: () => false,
  })
  isActive!: boolean;

  alignLeft: string = POPOVER_ALIGN.LEFT;

  @Prop({
    type: String,
  })
  category!: string;

  @VQBModule.State pipeline!: S.Pipeline;

  @VQBModule.Getter computedActiveStepIndex!: number;
  @VQBModule.Getter isEditingStep!: boolean;
  @VQBModule.Getter selectedColumns!: string[];

  @VQBModule.Mutation selectStep!: MutationCallbacks['selectStep'];
  @VQBModule.Mutation setPipeline!: MutationCallbacks['setPipeline'];
  @VQBModule.Mutation closeStepForm!: () => void;

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

  /**
   * @description Emit an event with a PipelineStepName in order to open its form
   */
  actionClicked(stepName: S.PipelineStepName) {
    if (
      (stepName === 'lowercase' || stepName === 'uppercase' || stepName === 'todate') &&
      this.selectedColumns.length > 0
    ) {
      this.createStep(stepName);
    } else {
      this.$emit('actionClicked', stepName);
    }
  }

  createStep(stepName: NoFormStep['name']) {
    const newPipeline: S.Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const step: NoFormStep = { name: stepName, column: this.selectedColumns[0] };
    /**
     * If a step edition form is already open, close it so that the left panel displays
     * the pipeline with the new delete step inserted
     */
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, step);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
  }

  get items() {
    return ACTION_CATEGORIES[this.category];
  }

  close() {
    this.$emit('closed');
  }

  @Watch('isActive')
  onIsActiveChanged(val: boolean) {
    if (val) {
      window.addEventListener('click', this.clickListener, { capture: true });
    } else {
      window.removeEventListener('click', this.clickListener, { capture: true });
    }
  }
}
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
</style>
