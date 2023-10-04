<template>
  <popover :visible="visible" :align="alignLeft" bottom @closed="close">
    <div class="data-types-menu__body">
      <div class="data-types-menu__section">
        <div class="data-types-menu__option--active" @click="createConvertStep('integer')">
          <span class="data-types-menu__icon">123</span>
          <span>Integer</span>
        </div>
        <div class="data-types-menu__option--active" @click="createConvertStep('float')">
          <span class="data-types-menu__icon">1.2</span>
          <span>Float</span>
        </div>
        <div class="data-types-menu__option--active" @click="createConvertStep('text')">
          <span class="data-types-menu__icon">ABC</span>
          <span>Text</span>
        </div>
        <div
          :class="{
            'data-types-menu__option--active': isCastableToDate,
            'data-types-menu__option--deactivated': !isCastableToDate,
          }"
          :title="isCastableToDate ? '' : 'Cannot be converted to date'"
          @click="openToDateStep()"
        >
          <span class="data-types-menu__icon">
            <FAIcon icon="calendar-alt" />
          </span>
          <span>Date</span>
        </div>
        <div
          :class="{
            'data-types-menu__option--active': isCastableToTime,
            'data-types-menu__option--deactivated': !isCastableToTime,
          }"
          :title="isCastableToTime ? '' : 'Cannot be converted to time'"
          @click="openToTimeStep()"
        >
          <span class="data-types-menu__icon">
            <FAIcon icon="clock" />
          </span>
          <span>Time</span>
        </div>
        <div class="data-types-menu__option--active" @click="createConvertStep('boolean')">
          <span class="data-types-menu__icon">
            <FAIcon icon="check" />
          </span>
          <span>Boolean</span>
        </div>
      </div>
    </div>
  </popover>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { POPOVER_ALIGN } from '@/components/constants';
import FAIcon from '@/components/FAIcon.vue';
import type { DataSetColumnType } from '@/lib/dataset';
import type { ConvertStep, Pipeline } from '@/lib/steps';
import { Action, Getter } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

import Popover from './Popover.vue';

type dataType = 'boolean' | 'date' | 'float' | 'integer' | 'text';
type PropMap<T> = { [prop: string]: T };

@Component({
  name: 'data-types-menu',
  components: {
    Popover,
    FAIcon,
  },
})
export default class DataTypesMenu extends Vue {
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

  @Getter(VQBModule) columnTypes!: PropMap<DataSetColumnType>;
  @Getter(VQBModule) computedActiveStepIndex!: number;
  @Getter(VQBModule) isEditingStep!: boolean;
  @Getter(VQBModule) pipeline?: Pipeline;

  @Action(VQBModule) selectStep!: VQBActions['selectStep'];
  @Action(VQBModule) setPipeline!: VQBActions['setPipeline'];
  @Action(VQBModule) closeStepForm!: VQBActions['closeStepForm'];

  alignLeft: string = POPOVER_ALIGN.LEFT;

  get isCastableToDate() {
    return (
      this.columnTypes[this.columnName] === 'date' ||
      this.columnTypes[this.columnName] === 'string' ||
      this.columnTypes[this.columnName] === 'integer'
    );
  }

  get isCastableToTime() {
    return (
      this.columnTypes[this.columnName] === 'string' ||
      this.columnTypes[this.columnName] === 'integer'
    );
  }

  close() {
    this.$emit('closed');
  }

  createConvertStep(dataType: dataType) {
    const newPipeline: Pipeline = [...this.pipeline!];
    const index = this.computedActiveStepIndex + 1;
    const convertStep: ConvertStep = {
      name: 'convert',
      columns: [this.columnName],
      dataType: dataType,
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

  openToDateStep() {
    // if string or int, we want to open the dedicated todate step where the user can
    // specify string formats
    if (
      this.columnTypes[this.columnName] === 'string' ||
      this.columnTypes[this.columnName] === 'integer'
    ) {
      this.$emit('actionClicked', 'todate');
      this.close();
    }
    // if date, we can convert the column directly
    if (this.columnTypes[this.columnName] === 'date') {
      this.createConvertStep('date');
    }
  }

  openToTimeStep() {
    if (this.columnTypes[this.columnName] === 'integer') {
      this.$emit('actionClicked', 'totimenumber');
      this.close();
    } else if (this.columnTypes[this.columnName] === 'string') {
      this.$emit('actionClicked', 'totimetext');
      this.close();
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

.data-types-menu__option--active {
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

.data-types-menu__option--deactivated {
  display: flex;
  align-items: center;
  cursor: not-allowed;
  font-size: 13px;
  padding: 10px 12px;
  line-height: 20px;
  position: relative;
  background-color: #d1d1d1;
  opacity: 0.3;
}

.data-types-menu__icon {
  font-family: 'Roboto Slab', serif;
  width: 30%;
}
</style>
