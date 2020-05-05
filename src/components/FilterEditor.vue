<template>
  <div class="filter-editor">
    <ConditionsEditor :conditions-tree="conditionsTree" @conditionsTreeUpdated="updateFilterTree">
      <template v-slot:default="slotProps">
        <FilterSimpleConditionWidget
          :value="slotProps.condition || undefined"
          @input="slotProps.updateCondition"
          :columnNamesProp="columnNames"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
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
import { VariableDelimiters } from '@/components/stepforms/widgets/VariableInput/extract-variable-name';
import { VariablesBucket } from '@/components/stepforms/widgets/VariableInput/VariableInput.vue';
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
  columnNames!: string[];

  @Prop()
  availableVariables!: VariablesBucket[];

  @Prop()
  variableDelimiters!: VariableDelimiters;

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
