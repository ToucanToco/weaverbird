<template>
  <popover :active="isActive" :align="alignLeft" bottom>
    <div class="data-types-menu__body">
      <div class="data-types-menu__section">
        <div class="data-types-menu__option" @click="createConvertStep('integer')">
          <span class="data-types-menu__icon">123</span>
          <span>Integer</span>
        </div>
        <div class="data-types-menu__option" @click="createConvertStep('float')">
          <span class="data-types-menu__icon">1.2</span>
          <span>Float</span>
        </div>
        <div class="data-types-menu__option" @click="createConvertStep('text')">
          <span class="data-types-menu__icon">ABC</span>
          <span>Text</span>
        </div>
        <div class="data-types-menu__option" @click="createConvertStep('date')">
          <span class="data-types-menu__icon">
            <i class="fas fa-calendar-alt" />
          </span>
          <span>Date</span>
        </div>
        <div class="data-types-menu__option" @click="createConvertStep('boolean')">
          <span class="data-types-menu__icon">
            <i class="fas fa-check" />
          </span>
          <span>Boolean</span>
        </div>
      </div>
    </div>
  </popover>
</template>
<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import { ConvertStep,Pipeline } from '@/lib/steps';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';

import Popover from './Popover.vue';

type dataType = 'boolean' | 'date' | 'float' | 'integer' | 'text';

@Component({
  name: 'data-types-menu',
  components: {
    Popover,
  },
})
export default class DataTypesMenu extends Vue {
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

  createConvertStep(dataType: dataType) {
    const newPipeline: Pipeline = [...this.pipeline];
    const index = this.computedActiveStepIndex + 1;
    const convertStep: ConvertStep = {
      name: 'convert',
      columns: [this.columnName],
      data_type: dataType,
    };
    // If a step edition form is already open, close it so that the left panel
    // displays the pipeline with the new delete step inserted
    if (this.isEditingStep) {
      this.closeStepForm();
    }
    newPipeline.splice(index, 0, convertStep);
    this.setPipeline({ pipeline: newPipeline });
    this.selectStep({ index });
    this.close();
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

.data-types-menu__body {
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

.data-types-menu__section {
  display: flex;
  flex-direction: column;
  border-color: $data-viewer-border-color;

  &:not(:last-child) {
    border-bottom-style: solid;
    border-bottom-width: 1px;
  }
}

.data-types-menu__option {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  position: relative;

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
    color: $active-color;
  }

  &:last-child {
    margin-bottom: 0;
  }
}

.data-types-menu__icon {
  font-family: 'Roboto Slab', serif;
  width: 30%;
}
</style>
