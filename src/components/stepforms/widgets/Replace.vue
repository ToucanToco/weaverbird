<template>
  <div class="widget-to-replace__container">
    <InputTextWidget
      class="valueToReplace"
      v-model="valueToReplace"
      placeholder="Value to replace"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
      :available-variables="availableVariables"
      :variable-delimiters="variableDelimiters"
    />
    <InputTextWidget
      class="newValue"
      v-model="newValueToReplace"
      placeholder="New value"
      :data-path="`${dataPath}[1]`"
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

import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

import InputTextWidget from './InputText.vue';

@Component({
  name: 'replace-widget',
  components: {
    InputTextWidget,
  },
})
export default class ReplaceWidget extends Vue {
  @Prop({
    type: Array,
    default: () => ['', ''],
  })
  value!: any[];

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  created() {
    if (isEqual(this.value, ['', ''])) {
      this.update(this.value);
    }
  }

  get valueToReplace() {
    return this.value[0];
  }

  set valueToReplace(newValue) {
    this.update([newValue, this.newValueToReplace]);
  }

  get newValueToReplace() {
    return this.value[1];
  }

  set newValueToReplace(newValue) {
    this.update([this.valueToReplace, newValue]);
  }

  update(newValues: string[]) {
    this.$emit('input', newValues);
  }
}
</script>
<style lang="scss" scoped>
.widget-to-replace__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 5px;
  margin-right: 5px;
  width: 50%;

  /deep/ .widget-input-variable {
    width: 90%;
  }
}
</style>
