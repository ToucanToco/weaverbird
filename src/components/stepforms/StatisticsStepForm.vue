<template>
  <div>
    <StepFormHeader :title="title" :stepName="editedStep.name" />
    <ColumnPicker
      v-model="editedStep.column"
      class="columnInput"
      name="Column:"
      placeholder="Select a column containing numbers"
      data-path=".column"
      :errors="errors"
      :types="['integer', 'float']"
    />
    <MultiselectWidget
      class="groupbyColumnsInput"
      v-model="editedStep.groupbyColumns"
      name="Group result by..."
      :options="columnNames"
      placeholder="Add columns"
      data-path=".groupByColumn"
      :errors="errors"
    />
    <div class="statistic-section-header" @click="isBasicStatisticsOpen = !isBasicStatisticsOpen">
      Basic Statistics ({{ basicStatisticsCheckedCount }})
      <i v-if="isBasicStatisticsOpen" class="fas fa-angle-down" />
      <i v-else class="fas fa-angle-right" />
    </div>
    <div class="statistic-section" v-if="isBasicStatisticsOpen">
      <div v-for="statistic in statistics" :key="statistic">
        <Checkbox
          :label="statistic"
          :value="isStatisticChecked(statistic)"
          @input="toogleStatistic(statistic)"
        />
      </div>
      <div v-for="quantile in quantiles" :key="quantile.label">
        <Checkbox
          :label="quantile.label"
          :value="isQuantileChecked(quantile)"
          @input="toogleQuantile(quantile)"
        />
      </div>
    </div>
    <div
      class="statistic-section-header"
      @click="isAdvancedStatisticsOpen = !isAdvancedStatisticsOpen"
    >
      Advanced Statistics ({{ advancedStatisticsCheckedCount }})
      <i v-if="isAdvancedStatisticsOpen" class="fas fa-angle-down" />
      <i v-else class="fas fa-angle-right" />
    </div>
    <div class="statistic-section" v-if="isAdvancedStatisticsOpen">
      <div v-for="statistic in advancedStatistics" :key="statistic">
        <Checkbox
          :label="statistic"
          :value="isStatisticChecked(statistic)"
          @input="toogleStatistic(statistic)"
        />
      </div>
      <div v-for="quantile in advancedQuantiles" :key="quantile.label">
        <Checkbox
          :label="quantile.label"
          :value="isQuantileChecked(quantile)"
          @input="toogleQuantile(quantile)"
        />
      </div>
    </div>
    <div class="statistic-section-header" @click="isCustomQuantileOpen = !isCustomQuantileOpen">
      Custom quantiles ({{ customQuantilesCheckedCount }})
      <i v-if="isCustomQuantileOpen" class="fas fa-angle-down" />
      <i v-else class="fas fa-angle-right" />
    </div>
    <div class="statistic-section" v-if="isCustomQuantileOpen">
      <div
        v-for="quantile in customQuantiles"
        :key="`${quantile.nth}-th ${quantile.order}-quantile`"
      >
        <Checkbox
          :label="`${quantile.nth}-th ${quantile.order}-quantile`"
          :value="true"
          @input="toogleQuantile(quantile)"
        />
      </div>
      <div class="custom-quantile">
        <div class="custom-quantile-widget-checkbox" @click="toogleQuantile(customQuantilesForm)" />
        <InputNumberWidget
          style="width: 80px;"
          v-model="customQuantilesForm.nth"
          type="number"
          :min="1"
          :max="customQuantilesForm.order - 1"
          class="custom-quantile-input"
          data-path=".nth"
          :errors="errors"
        />-th
        <InputNumberWidget
          style="width: 80px;"
          v-model="customQuantilesForm.order"
          type="number"
          :errors="errors"
          :min="1"
          class="custom-quantile-input"
          data-path=".order"
        />-quantile
      </div>
    </div>
    <StepFormButtonbar />
  </div>
</template>

<script lang="ts">
import Ajv from 'ajv';
import _intersection from 'lodash/intersection';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

import { PipelineStepName, Quantile, Statistics, StatisticsStep } from '../../lib/steps';
import ColumnPicker from '..//stepforms/ColumnPicker.vue';
import Checkbox from '..//stepforms/widgets/Checkbox.vue';
import InputNumberWidget from '..//stepforms/widgets/InputNumber.vue';
import MultiselectWidget from '..//stepforms/widgets/Multiselect.vue';
import BaseStepForm from './StepForm.vue';

@Component({
  name: 'statistics-step-form',
  components: {
    ColumnPicker,
    Checkbox,
    InputNumberWidget,
    MultiselectWidget,
  },
})
export default class StatisticsStepForm extends BaseStepForm<StatisticsStep> {
  stepname: PipelineStepName = 'statistics';

  @Prop({
    type: Object,
    default: (): StatisticsStep => ({
      name: 'statistics',
      column: '',
      groupbyColumns: [],
      statistics: [],
      quantiles: [],
    }),
  })
  initialStepValue!: StatisticsStep;

  customQuantilesForm: any = {
    nth: '',
    order: '',
  };

  readonly title: string = 'Compute statistics';

  // statistics repartition between advanced and basic:
  readonly statistics = ['count', 'average', 'min', 'max'];
  readonly quantiles: Quantile[] = [
    {
      label: 'median',
      nth: 1,
      order: 2,
    },
  ];
  readonly advancedStatistics = ['standard deviation', 'variance'];
  readonly advancedQuantiles: Quantile[] = [
    {
      label: 'first quartile',
      nth: 1,
      order: 4,
    },
    {
      label: 'last quartile',
      nth: 3,
      order: 4,
    },
    {
      label: 'first decile',
      nth: 1,
      order: 10,
    },
    {
      label: 'last decile',
      nth: 9,
      order: 10,
    },
    {
      label: 'first centile',
      nth: 1,
      order: 100,
    },
    {
      label: 'last centile',
      nth: 99,
      order: 100,
    },
  ];

  // the step is dived in 3 sections
  isBasicStatisticsOpen = true;
  isAdvancedStatisticsOpen = false;
  isCustomQuantileOpen = false;

  get customQuantiles(): Quantile[] {
    return this.editedStep.quantiles.filter(({ label }) => {
      return label === undefined;
    });
  }

  get basicStatisticsCheckedCount() {
    const statisticsCount = _intersection(this.editedStep.statistics, this.statistics).length;
    const quantileCount = _intersection(
      this.editedStep.quantiles.map(({ label }) => label),
      this.quantiles.map(({ label }) => label),
    ).length;
    return statisticsCount + quantileCount;
  }

  get advancedStatisticsCheckedCount() {
    const statisticsCount = _intersection(this.editedStep.statistics, this.advancedStatistics)
      .length;
    const quantileCount = _intersection(
      this.editedStep.quantiles.map(({ label }) => label),
      this.advancedQuantiles.map(({ label }) => label),
    ).length;
    return statisticsCount + quantileCount;
  }

  get customQuantilesCheckedCount() {
    return this.customQuantiles.length;
  }

  // utils to manipulate quantiles and statistics:
  isStatisticChecked(statistic: Statistics): boolean {
    return this.editedStep.statistics.includes(statistic);
  }

  isQuantileChecked(quantile: Quantile): boolean {
    return (
      this.editedStep.quantiles.filter(
        ({ label, nth, order }) =>
          label === quantile.label && nth === quantile.nth && order === quantile.order,
      ).length > 0
    );
  }

  toogleStatistic(statistic: Statistics) {
    if (this.isStatisticChecked(statistic)) {
      this.editedStep.statistics = this.editedStep.statistics.filter(s => s !== statistic);
    } else {
      this.editedStep.statistics.push(statistic);
    }
  }

  toogleQuantile(quantile: Quantile) {
    // parse quantile
    quantile = {
      nth: parseInt(quantile.nth),
      order: parseInt(quantile.order),
      label: quantile.label,
    };
    if (this.isQuantileChecked(quantile)) {
      // remove quantile from selected one
      this.editedStep.quantiles = this.editedStep.quantiles.filter(
        ({ label, nth, order }) =>
          label !== quantile.label || nth !== quantile.nth || order !== quantile.order,
      );
    } else {
      // compile schema errors
      const validator = Ajv({ schemaId: 'auto', allErrors: true }).compile({
        type: 'object',
        required: ['nth', 'order'],
        properties: {
          label: { type: 'string' },
          nth: {
            type: 'number',
            minimum: 1,
          },
          order: { type: 'number', minimum: (quantile.nth || 0) + 1 },
        },
      });

      const isValide = validator(quantile);
      this.errors = validator.errors;

      if (isValide) {
        // add quantile into selected one
        this.editedStep.quantiles.push(quantile);
        // reinit customQuantilesForm
        this.customQuantilesForm = {
          nth: '',
          order: '',
        };
      }
    }
  }
}
</script>
<style lang="scss" scoped>
@import '../../styles/_variables';

.statistic-section {
  margin-bottom: 20px;
}
.statistic-section-header {
  margin-bottom: 20px;
  cursor: pointer;
}
.custom-quantile-input {
  padding: 10px;
  width: 60px;
  font-size: 16px;
  margin-left: 20px;
}

.custom-quantile {
  display: flex;
  align-items: center;
}

.custom-quantile-widget-checkbox {
  align-items: center;
  display: flex;
  width: 30px;
  margin: 0;
  cursor: pointer;

  &:active,
  &:focus,
  &:hover {
    &::after {
      opacity: 1;
    }
  }

  &::before,
  &::after {
    content: '';
    order: -1;
  }

  &::before {
    box-shadow: 0 0 0 2px $base-color inset;
    height: 24px;
    width: 24px;
  }

  &::after {
    box-shadow: 3px -3px 0 0 $base-color inset;
    height: 8px;
    margin-left: -18px;
    margin-right: 6px;
    margin-top: -3px;
    opacity: 0.25;
    transform: rotate(-45deg);
    width: 12px;
  }
}
</style>
