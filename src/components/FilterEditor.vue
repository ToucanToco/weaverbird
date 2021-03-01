<template>
  <div class="filter-editor">
    <ConditionsEditor
      :conditions-tree="conditionsTree"
      @conditionsTreeUpdated="updateFilterTree"
      :defaultValue="defaultValue"
    >
      <template v-slot:default="slotProps">
        <FilterSimpleConditionWidget
          :value="slotProps.condition || undefined"
          @input="slotProps.updateCondition"
          :columnNamesProp="Object.keys(columnTypes)"
          :available-variables="availableVariables"
          :variable-delimiters="variableDelimiters"
          :data-path="slotProps.dataPath"
          :errors="errors"
          :multi-variable="multiVariable"
          :columnTypes="columnTypes"
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
  castFilterStepTreeValue,
} from '@/components/stepforms/convert-filter-step-tree.ts';
import FilterSimpleConditionWidget, {
  DEFAULT_FILTER,
} from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import { ColumnTypeMapping } from '@/lib/dataset/index.ts';
import { FilterCondition } from '@/lib/steps';
import { VariableDelimiters, VariablesBucket } from '@/lib/variables';

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
  filterTree!: FilterCondition;

  @Prop({
    type: Object,
    default: () => ({}),
  })
  columnTypes!: ColumnTypeMapping;

  @Prop()
  availableVariables?: VariablesBucket;

  @Prop()
  variableDelimiters?: VariableDelimiters;

  @Prop({ type: Boolean, default: true })
  multiVariable!: boolean; // display multiInputText as multiVariableInput

  @Prop({
    type: Array,
    default: () => [],
  })
  errors!: ErrorObject[];

  readonly defaultValue = DEFAULT_FILTER;

  get conditionsTree() {
    const esJsonEnabled =
      this.$store?.state?.vqb?.featureFlags != undefined &&
      this.$store.state.vqb.featureFlags.QUERYBUILDER_ESJSON == 'enable';
    return buildConditionsEditorTree(
      castFilterStepTreeValue(this.filterTree, this.columnTypes, esJsonEnabled),
    );
  }

  updateFilterTree(newConditionsTree: AbstractFilterTree) {
    const newFilterTree = buildFilterStepTree(newConditionsTree);
    this.$emit('filterTreeUpdated', newFilterTree);
  }
}
</script>
