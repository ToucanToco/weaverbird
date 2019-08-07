<template>
  <fieldset class="widget-sort__container">
    <AutocompleteWidget
      id="columnInput"
      :options="columnNames"
      v-model="sort.column"
      name="Column"
      placeholder="Enter a column"
      @input="setSelectedColumns({ column: sort.column })"
    ></AutocompleteWidget>
    <AutocompleteWidget
      id="sortOrderInput"
      v-model="sort.order"
      name="Order"
      :options="['asc', 'desc']"
      placeholder="Order by"
    ></AutocompleteWidget>
  </fieldset>
</template>
<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { VQBModule } from '@/store';
import { MutationCallbacks } from '@/store/mutations';
import AutocompleteWidget from './Autocomplete.vue';
import { SortColumnType } from '@/lib/steps';

@Component({
  name: 'sort-column-widget',
  components: {
    AutocompleteWidget,
  },
})
export default class SortColumnWidget extends Vue {
  @Prop({
    type: Object,
    default: () => ({
      column: '',
      order: 'asc',
    }),
  })
  value!: SortColumnType;

  @VQBModule.Getter columnNames!: string[];

  @VQBModule.Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

  sort: SortColumnType = { ...this.value };

  @Watch('value', { immediate: true, deep: true })
  onSortChanged(newval: SortColumnType, oldval: SortColumnType) {
    if (!_.isEqual(newval, oldval)) {
      this.sort = { ...newval };
      this.$emit('input', this.sort);
    }
  }
}
</script>

