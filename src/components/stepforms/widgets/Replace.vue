<template>
  <div class="widget-to-replace__container">
    <InputTextWidget
      id="valueToReplace"
      v-model="valueToReplace"
      placeholder="Value to replace"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
    />
    <InputTextWidget
      id="newValue"
      v-model="newValueToReplace"
      placeholder="New value"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
    />
  </div>
</template>
<script lang="ts">
import _ from 'lodash';
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

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

  created() {
    if(_.isEqual(this.value, ['', ''])) {
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
}
</style>
