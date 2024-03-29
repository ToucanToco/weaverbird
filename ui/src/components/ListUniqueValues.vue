<template>
  <div class="list-unique-values">
    <div class="list-unique-values__title">Filter values</div>
    <input class="list-unique-values__search-box" placeholder="Search 50 items" v-model="search" />
    <div class="list-unique-values__select-clear-all">
      <span class="list-unique-values__select-all" @click="selectAll">Select all</span> &nbsp;
      <span class="list-unique-values__clear-all" @click="clearAll">Clear all</span>
    </div>
    <div class="list-unique-values__checkbox-container">
      <div
        class="list-unique-values__checkbox"
        v-for="option in searchedOptions"
        :key="stringify(option.value)"
      >
        <CheckboxWidget
          :label="stringify(option.value)"
          :info="`(${option.count})`"
          :croppedLabel="true"
          :value="isChecked(option)"
          @input="toggleCheck(option)"
        />
      </div>
      <div v-if="isLoading.uniqueValues" class="list-unique-values__loader-spinner" />
      <div v-if="!loaded && !isLoading.uniqueValues" class="list-unique-values__load-all-values">
        <div>List maybe incomplete</div>
        <div
          @click="loadColumnUniqueValues({ column: columnName })"
          class="list-unique-values__load-all-values-button"
        >
          Load all values
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import _difference from 'lodash/difference';
import _union from 'lodash/union';
import { Component, Prop, Vue } from 'vue-property-decorator';

import type { ColumnValueStat } from '@/lib/dataset/helpers';
import type { FilterConditionInclusion } from '@/lib/steps';
import { Action, State } from 'pinia-class';
import { VQBModule, type VQBActions } from '@/store';

import CheckboxWidget from './stepforms/widgets/Checkbox.vue';

/**
  Edit a `filter` object of the form:
  filter = {
    column: 'toto', // this key should not be updated by this component
    operator: 'in' // or `nin` which means 'not in'
    value: ['France', 'UK', 'Spain']
  }
 */
@Component({
  name: 'list-unique-values',
  components: { CheckboxWidget },
})
export default class ListUniqueValues extends Vue {
  @Prop({
    type: String,
    required: true,
  })
  columnName!: string;

  @Prop({
    type: Array,
    required: true,
  })
  options!: ColumnValueStat[];

  @Prop({
    type: Object,
    required: true,
  })
  filter!: Omit<FilterConditionInclusion, 'column'>;

  @Prop({
    type: Boolean,
    required: true,
  })
  loaded!: boolean;

  @State(VQBModule) isLoading!: { dataset: boolean; uniqueValues: boolean };
  @Action(VQBModule) loadColumnUniqueValues!: VQBActions['loadColumnUniqueValues'];

  search = '';

  isChecked(option: ColumnValueStat): boolean {
    if (this.filter.operator == 'in') {
      return this.filter.value.includes(option.value);
    } else {
      return !this.filter.value.includes(option.value);
    }
  }

  selectAll() {
    if (this.search === '') {
      this.$emit('input', {
        column: this.columnName,
        operator: 'nin',
        value: [],
      } as FilterConditionInclusion);
    } else {
      this.$emit('input', {
        column: this.columnName,
        operator: this.filter.operator,
        value: (this.filter.operator === 'in' ? _union : _difference)(
          this.filter.value,
          this.searchedOptions.map((option) => option.value),
        ),
      } as FilterConditionInclusion);
    }
  }

  clearAll() {
    if (this.search === '') {
      this.$emit('input', {
        column: this.columnName,
        operator: 'in',
        value: [],
      } as FilterConditionInclusion);
    } else {
      this.$emit('input', {
        column: this.columnName,
        operator: this.filter.operator,
        value: (this.filter.operator === 'in' ? _difference : _union)(
          this.filter.value,
          this.searchedOptions.map((option) => option.value),
        ),
      } as FilterConditionInclusion);
    }
  }

  toggleCheck(option: ColumnValueStat) {
    const newFilter = { ...this.filter, column: this.columnName };
    if (newFilter.value.includes(option.value)) {
      newFilter.value.splice(newFilter.value.indexOf(option.value), 1);
    } else {
      newFilter.value.push(option.value);
    }
    this.$emit('input', newFilter);
  }

  get searchedOptions(): ColumnValueStat[] {
    return this.options.filter((option) => this.searchFunction(option.value, this.search));
  }

  stringify(value: any): string {
    return JSON.stringify(value).replace(/^"/, '').replace(/"$/, ''); // remove `"` introduce by JSON.stringify around strings;
  }

  searchFunction(value: any, search: string) {
    return this.stringify(value).toLowerCase().includes(search.toLowerCase());
  }

  loadAllValues() {
    this.$emit('loadAllValues');
  }
}
</script>
<style lang="scss" scoped>
@import '../styles/_variables.scss';

.list-unique-values__title {
  text-transform: uppercase;
}

.list-unique-values {
  background-color: $light-grey;
  padding: 10px 12px;
  font-size: 13px;
  white-space: nowrap;
}

.list-unique-values__search-box {
  padding: 5px;
  margin: 10px 0px;
  width: 100%;
  outline: none;
  box-sizing: border-box;
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
  max-height: 250px;
  overflow: auto;
}

.list-unique-values__checkbox {
  border-bottom: 2px #ededed solid;
  font-weight: 600;
  margin: 10px 0px;
}

::v-deep .widget-checkbox__label {
  font-size: 12px !important;
}

::v-deep .widget-checkbox {
  margin-bottom: 10px !important;
}

.list-unique-values__load-all-values {
  background-color: #f7f4e2;
  padding: 10px;
  border-radius: 5px;

  .list-unique-values__load-all-values-button {
    text-decoration: underline;
    font-weight: 700;
    cursor: pointer;
  }
}

.list-unique-values__loader-spinner {
  border-radius: 50%;
  border: 4px solid #efefef;
  border-top-color: $active-color;
  width: 20px;
  height: 20px;
  animation: spin 1500ms ease-in-out infinite;
  margin: 20px auto;
}

@keyframes spin {
  to {
    transform: rotate(1turn);
  }
}
</style>
