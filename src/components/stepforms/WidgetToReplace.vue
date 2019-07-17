<template>
  <div class="widget-to-replace__container">
    <WidgetInputText id="valueToReplace" v-model="toReplace[0]" placeholder="Value to replace"></WidgetInputText>
    <WidgetInputText id="newValue" v-model="toReplace[1]" placeholder="New value"></WidgetInputText>
  </div>
</template>
<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import WidgetInputText from './WidgetInputText.vue';

@Component({
  name: 'widget-to-replace',
  components: {
    WidgetInputText,
  },
})
export default class WidgetToReplace extends Vue {
  @Prop({
    type: Array,
    default: () => ['', ''],
  })
  value!: any[];

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
