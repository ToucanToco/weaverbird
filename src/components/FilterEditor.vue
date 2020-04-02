<template>
  <div class="filter-editor">
    <ConditionsEditor :conditions-tree="conditionsTree" @conditionsTreeUpdated="updateFilterTree">
      <template v-slot:default="slotProps">
        <FilterSimpleConditionWidget
          :value="slotProps.condition"
          @input="slotProps.updateCondition"
          :data-path="slotProps.dataPath"
          :errors="errors"
        />
      </template>
    </ConditionsEditor>
  </div>
</template>

<script lang="ts">
import { ErrorObject } from 'ajv';
import { Component, Prop, Vue } from 'vue-property-decorator';

import ConditionsEditor from '@/components/ConditionsEditor/ConditionsEditor.vue';
import { AbstractFilterTree } from '@/components/ConditionsEditor/tree-types';
import {
  buildConditionsEditorTree,
  buildFilterStepTree,
} from '@/components/stepforms/convert-filter-step-tree.ts';
import FilterSimpleConditionWidget from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import { FilterComboAnd, FilterComboOr, FilterSimpleCondition } from '@/lib/steps';

@Component({
  name: 'filter-editor',
  components: {
    ConditionsEditor,
    FilterSimpleConditionWidget,
  },
})
export default class FilterEditor extends Vue {
  @Prop({
    type: Object,
    default: () => ({ column: '', value: '', operator: 'eq' }),
  })
  filterTree!: FilterSimpleCondition | FilterComboAnd | FilterComboOr;

  @Prop({
    type: Array,
    default: () => [],
  })
  errors!: ErrorObject[];

  get conditionsTree() {
    return buildConditionsEditorTree(this.filterTree);
  }

  updateFilterTree(newConditionsTree: AbstractFilterTree) {
    const newFilterTree = buildFilterStepTree(newConditionsTree);
    this.$emit('filterTreeUpdated', newFilterTree);
  }
}
</script>
