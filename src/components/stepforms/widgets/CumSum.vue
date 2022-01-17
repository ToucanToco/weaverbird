<template>
  <div class="widget-to-cumsum__container">
    <ColumnPicker
      class="columnToCumSum"
      name
      v-model="columnToCumSum"
      placeholder="Enter a column"
      :syncWithSelectedColumn="false"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="newColumn"
      v-model="newColumnToCumSum"
      :placeholder="`${columnToCumSum}_CUMSUM`"
      :data-path="`${dataPath}[1]`"
      :warning="duplicateColumnName"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
  </div>
</template>
<script lang="ts">
import { ErrorObject } from 'ajv';
import isEqual from 'lodash/isEqual';
import { Component, Prop, Vue } from 'vue-property-decorator';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';
import { VQBModule } from '@/store';

import InputTextWidget from './InputText.vue';

@Component({
  name: 'cumsum-widget',
  components: {
    ColumnPicker,
    InputTextWidget,
  },
})
export default class CumSumWidget extends Vue {
  @Prop({
    type: Array,
    default: () => ['', ''],
  })
  value!: string[];

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @VQBModule.Getter columnNames!: string[];

  created() {
    if (isEqual(this.value, ['', ''])) {
      this.update(this.value);
    }
  }

  get columnToCumSum() {
    return this.value[0];
  }

  set columnToCumSum(newColumnName) {
    this.update([newColumnName, this.newColumnToCumSum]);
  }

  get duplicateColumnName() {
    if (this.columnNames.includes(this.newColumnToCumSum)) {
      return `A column name "${this.newColumnToCumSum}" already exists. You will overwrite it.`;
    } else {
      return null;
    }
  }

  get newColumnToCumSum() {
    return this.value[1];
  }

  set newColumnToCumSum(newColumnName) {
    this.update([this.columnToCumSum, newColumnName]);
  }

  update(newValues: string[]) {
    this.$emit('input', newValues);
  }
}
</script>
<style lang="scss" scoped>
.widget-to-cumsum__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-autocomplete__container {
  width: 50%;

  ::v-deep .widget-input-variable {
    width: 90%;
  }
}

.widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 5px;
  margin-right: 5px;
  width: 50%;

  ::v-deep .widget-input-variable {
    width: 90%;
  }
}
</style>
