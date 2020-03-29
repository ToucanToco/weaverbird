<template>
  <div class="list-unique-values">
    <div>FILTER VALUES</div>
    <input
      class="list-unique-values__search-box"
      placeholder="Search 50 items"
      @input="search($event.target.value)"
    />
    <div class="list-unique-values__select-clear-all">
      <span class="list-unique-values__select-all" @click="selectAll">Select all</span> &nbsp;
      <span class="list-unique-values__clear-all" @click="clearAll">Clear all</span>
    </div>
    <div
      class="list-unique-values__checkbox-container"
      v-for="value in searchedValues"
      :key="value.value"
    >
      <CheckboxWidget
        :label="`${value.value} (${value.nbOcc})`"
        :value="isChecked[value.value]"
        @input="toggleCheck(value.value)"
      />
    </div>
  </div>
</template>
<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator';

import { ColumnValueStat } from '@/lib/dataset/helpers.ts';

import CheckboxWidget from './stepforms/widgets/Checkbox.vue';
@Component({
  name: 'filter-value',
  components: { CheckboxWidget },
})
export default class ActionMenu extends Vue {
  @Prop({
    type: Array,
    required: true,
  })
  values!: ColumnValueStat[];

  searchedValues: ColumnValueStat[] = this.values;

  /**  
  Warning: This component is mounted at the time than ActionMenu, which is mounted at the same time as DataSetViewer
  Consequently: the value will stay checked or unchecked when closing the ActionMenu and
  the state will be reloaded at dataset reload
  */
  isChecked: Record<string, boolean> = Object.fromEntries(this.values.map(e => [e.value, true]));

  selectAll() {
    this.isChecked = Object.fromEntries(this.values.map(e => [e.value, true]));
    this.$emit('input', Object.keys(this.isChecked));
  }

  clearAll() {
    this.isChecked = Object.fromEntries(this.values.map(e => [e.value, false]));
    this.$emit('input', []);
  }

  toggleCheck(value: string) {
    this.isChecked[value] = !this.isChecked[value];
    this.$emit(
      'input',
      Object.keys(this.isChecked).filter(k => {
        return this.isChecked[k];
      }),
    );
  }

  search(search: string) {
    this.searchedValues = this.values.filter(k => {
      return this.searchFunction(k.value, search);
    });
  }

  // TODO: enhance searchFunction
  searchFunction(value: string, search: string) {
    return value.startsWith(search);
  }
}
</script>
<style lang="scss" scoped>
// @import '../styles/_variables';

.list-unique-values {
  max-height: 300px;
  overflow: auto;
  background-color: #fafafa; //$grey
  padding: 10px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.list-unique-values__search-box {
  padding: 5px;
  margin: 10px 0px;
  width: calc(100% - 20px); // 10px * 2 because of the .list-unique-values' padding
  outline: none;
}

.list-unique-values__search-box::placeholder {
  font-style: italic;
  color: #cccccc;
}

.list-unique-values__select-clear-all {
  margin: 0px 0px 15px;
  font-size: 11px;
  span {
    text-decoration: underline;
    cursor: pointer;
  }
}

.list-unique-values__checkbox-container {
  min-width: fit-content;
  border-bottom: 2px #ededed solid;
  font-weight: 600;
  margin: 10px 0px;
}

/deep/ .widget-checkbox__label {
  font-size: 12px !important;
}

/deep/ .widget-checkbox {
  margin-bottom: 10px !important;
}
</style>
