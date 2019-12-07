<template>
  <div class="widget-to-replace__container">
    <InputTextWidget
      id="valueToReplace"
      v-model="toReplace[0]"
      placeholder="Value to replace"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
    />
    <InputTextWidget
      id="newValue"
      v-model="toReplace[1]"
      placeholder="New value"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
    />
  </div>
</template>
<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { ErrorObject } from 'ajv';

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

  toReplace: any[] = [...this.value];

  @Watch('toReplace', { immediate: true, deep: true })
  onToReplaceChanged(newval: any[], oldval: any[]) {
    if (!_.isEqual(newval, oldval)) {
      this.$emit('input', this.toReplace);
    }
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
