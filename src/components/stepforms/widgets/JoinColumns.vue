<template>
  <div class="widget-join-column__container">
    <AutocompleteWidget
      id="leftOn"
      @input="setRightColumn()"
      v-model="joinColumns[0]"
      placeholder="Current dataset column"
      :options="columnNames"
      :data-path="`${dataPath}[0]`"
      :errors="errors"
    />
    <InputTextWidget
      id="rightOn"
      v-model="joinColumns[1]"
      placeholder="Right dataset column"
      :data-path="`${dataPath}[1]`"
      :errors="errors"
    />
  </div>
</template>
<script lang="ts">
import _ from 'lodash';
import { VQBModule } from '@/store';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import AutocompleteWidget from '@/components/stepforms/widgets/Autocomplete.vue';
import InputTextWidget from './InputText.vue';
import { ErrorObject } from 'ajv';

@Component({
  name: 'join-colum-widget',
  components: {
    AutocompleteWidget,
    InputTextWidget,
  },
})
export default class JoinColumns extends Vue {
  @Prop({
    type: Array,
    default: () => ['', ''],
  })
  value!: string[];

  @Prop({ type: String, default: null })
  dataPath!: string;

  @Prop({ type: Array, default: () => [] })
  errors!: ErrorObject[];

  @VQBModule.Getter columnNames!: string[];

  joinColumns: string[] = [...this.value];

  @Watch('joinColumns', { immediate: true, deep: true })
  onJoinColumnsChanged(newval: any[], oldval: any[]) {
    if (!_.isEqual(newval, oldval)) {
      this.$emit('input', this.joinColumns);
    }
  }

  setRightColumn() {
    if (this.joinColumns[1] === '') {
      this.joinColumns[1] = this.joinColumns[0];
    }
  }
}
</script>
<style lang="scss" scoped>
.widget-join-column__container {
  background-color: white;
  display: flex;
  min-height: 45px;
  width: 100%;
}

.widget-join-column__container /deep/ .widget-autocomplete__container {
  width: 50%;
}

.widget-join-column__container /deep/ .widget-input-text__container {
  margin-bottom: 0px;
  margin-left: 10px;
  margin-right: 5px;
  width: 50%;
}

.widget-join-column__container /deep/ .multiselect {
  width: 100%;
  margin-right: 10px;
  width: 100%;
}
</style>
