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
          :trusted-variable-delimiters="trustedVariableDelimiters"
          :hideColumnVariables="hideColumnVariables"
          :data-path="slotProps.dataPath"
          :errors="errors"
          :multi-variable="multiVariable"
          :columnTypes="columnTypes"
          @setSelectedColumns="$emit('setSelectColumns', $event)"
        />
      </template>
    </ConditionsEditor>
  </div>
</template>

<script lang="ts">
import type { ErrorObject } from 'ajv';
import { defineComponent, PropType } from 'vue';

import ConditionsEditor from '@/components/ConditionsEditor/ConditionsEditor.vue';
import type { AbstractFilterTree } from '@/components/ConditionsEditor/tree-types';
import {
  buildConditionsEditorTree,
  buildFilterStepTree,
  castFilterStepTreeValue,
} from '@/components/stepforms/convert-filter-step-tree';
import FilterSimpleConditionWidget, {
  DEFAULT_FILTER,
} from '@/components/stepforms/widgets/FilterSimpleCondition.vue';
import type { ColumnTypeMapping } from '@/lib/dataset';
import type { FilterCondition } from '@/lib/steps';
import type { VariableDelimiters, VariablesBucket } from '@/lib/variables';

export default defineComponent({
  name: 'filter-editor',

  components: {
    ConditionsEditor,
    FilterSimpleConditionWidget,
  },

  props: {
    filterTree: {
      type: Object as PropType<FilterCondition>,
      default: () => ({ column: '', value: '', operator: 'eq' }),
    },
    columnTypes: {
      type: Object as PropType<ColumnTypeMapping>,
      default: () => ({}),
    },
    availableVariables: {
      type: Object as PropType<VariablesBucket>,
    },
    variableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
    },
    trustedVariableDelimiters: {
      type: Object as PropType<VariableDelimiters>,
    },
    hideColumnVariables: {
      type: Boolean,
    },
    multiVariable: {
      type: Boolean,
      default: true,
    },
    errors: {
      type: Array as PropType<ErrorObject[]>,
      default: () => [],
    },
  },

  data() {
    return {
      defaultValue: DEFAULT_FILTER,
    };
  },

  computed: {
    conditionsTree() {
      return buildConditionsEditorTree(castFilterStepTreeValue(this.filterTree, this.columnTypes));
    },
  },

  methods: {
    updateFilterTree(newConditionsTree: AbstractFilterTree) {
      const newFilterTree = buildFilterStepTree(newConditionsTree);
      this.$emit('filterTreeUpdated', newFilterTree);
    },
  },
});
</script>
