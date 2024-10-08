<template>
  <div class="widget-totals__container">
    <AutocompleteWidget
      class="widget-totals__column"
      v-model="totalColumn"
      placeholder="Column to add totals rows in"
      :options="columnNames"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
      :allowCustom="true"
    />
    <InputTextWidget
      class="widget-totals__total-rows-label"
      v-model="totalRowsLabel"
      placeholder="Total rows label"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
      :trusted-variable-delimiters="trustedVariableDelimiters"
    />
  </div>
</template>
<script lang="ts">
import type { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import type { TotalDimension } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import InputTextWidget from './InputText.vue';

@Component({
  name: 'total-dimensions-widget',
  components: {
    AutocompleteWidget,
    InputTextWidget,
  },
})
export default class TotalDimensionsWidget extends Vue {
  @Prop({
    type: Object,
    default: () => ({ columnTotal: '', totalRowsLabel: '' }),
  })
  value!: TotalDimension;

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop()
  trustedVariableDelimiters?: VariableDelimiters;

  @Prop({ default: () => [] })
  columnNames!: string[];

  get totalColumn() {
    return this.value.totalColumn;
  }

  set totalColumn(newColumn: string) {
    this.update({ totalColumn: newColumn, totalRowsLabel: this.totalRowsLabel });
  }

  get totalRowsLabel() {
    return this.value.totalRowsLabel;
  }

  set totalRowsLabel(newTotalRowsLabel: string) {
    this.update({ totalColumn: this.totalColumn, totalRowsLabel: newTotalRowsLabel });
  }

  update(newTotalDimensions: TotalDimension) {
    this.$emit('input', newTotalDimensions);
  }
}
</script>
<style lang="scss" scoped>
.widget-totals__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-totals__container ::v-deep .widget-autocomplete__container {
  width: 50%;
}

.widget-totals__container ::v-deep .widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 10px;
  margin-right: 5px;
  width: 50%;
}

.widget-totals__container ::v-deep .multiselect {
  width: 100%;
  margin-right: 10px;
}
</style>
