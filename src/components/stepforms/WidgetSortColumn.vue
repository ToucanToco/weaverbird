<template>
  <fieldset class="widget-sort__container">
    <WidgetAutocomplete
      id="columnInput"
      :options="columnNames"
      v-model="sort.column"
      name="Column"
      placeholder="Enter a column"
      @input="setSelectedColumns({ column: sort.column })"
    ></WidgetAutocomplete>
    <WidgetAutocomplete
      id="sortOrderInput"
      v-model="sort.order"
      name="Order"
      :options="['asc', 'desc']"
      placeholder="Order by"
    ></WidgetAutocomplete>
  </fieldset>
</template>
<script lang="ts">
import _ from 'lodash';
import { Component, Prop, Vue, Watch } from 'vue-property-decorator';
import { Getter, Mutation } from 'vuex-class';
import { MutationCallbacks } from '@/store/mutations';
import WidgetAutocomplete from './WidgetAutocomplete.vue';
import { SortColumnType } from '@/lib/steps';

const defaultValues: SortColumnType = {
  column: '',
  order: 'asc',
};

@Component({
  name: 'widget-sort-column',
  components: {
    WidgetAutocomplete,
  },
})
export default class WidgetSortColumn extends Vue {
  @Prop({
    type: Object,
    default: () => ({
      column: '',
      order: 'asc',
    }),
  })
  value!: SortColumnType;

  @Getter columnNames!: string[];

  @Mutation setSelectedColumns!: MutationCallbacks['setSelectedColumns'];

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

