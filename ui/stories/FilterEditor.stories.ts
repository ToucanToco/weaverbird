import type { Meta, StoryFn } from '@storybook/vue';
import Vuex from 'vuex';

import FilterEditor from '@/components/FilterEditor.vue';
import type { ColumnTypeMapping } from '@/lib/dataset';
import type { FilterCondition } from '@/lib/steps';
import type { AvailableVariable, VariableDelimiters } from '@/lib/variables';

export default {
  component: FilterEditor,
} as Meta<typeof FilterEditor>;

export const Default: StoryFn<typeof FilterEditor> = () => ({
  template: `
    <div style="margin: 30px; overflow: auto">
      <FilterEditor
        :filterTree="filterTree"
        :columnTypes="columnTypes"
        @filterTreeUpdated="updateFilterTree"
      />
      <pre style="margin-top: 30px;">{{ filterTreeStringify }}</pre>
    </div>
  `,

  store: new Vuex.Store({}),

  components: {
    FilterEditor,
  },

  data(): {
    filterTree: FilterCondition;
    columnTypes: ColumnTypeMapping;
  } {
    return {
      filterTree: {
        and: [
          { column: 'name', operator: 'eq', value: 'John' },
          { column: 'status', operator: 'ne', value: 'disabled' },
          {
            or: [
              { column: 'age', operator: 'ge', value: '10' },
              { column: 'age', operator: 'le', value: '20' },
            ],
          },
        ],
      },
      columnTypes: {
        name: 'string',
        status: 'string',
        age: 'integer',
      },
    };
  },

  computed: {
    filterTreeStringify() {
      return JSON.stringify(this.filterTree, null, 2);
    },
  },

  methods: {
    updateFilterTree(newFilterTree: FilterCondition) {
      this.filterTree = newFilterTree;
    },
  },
});

export const WithVariables: StoryFn<typeof FilterEditor> = () => ({
  template: `
    <div>
      <FilterEditor
        :filter-tree="filterTree"
        @filterTreeUpdated="updateFilterTree"
        :available-variables="availableVariables"
        :variableDelimiters="variableDelimiters"
      />
      <pre style="margin-top: 30px;">{{ filterTreeStringify }}</pre>
    </div>
  `,

  store: new Vuex.Store({}),

  components: {
    FilterEditor,
  },

  data(): {
    availableVariables: AvailableVariable[];
    variableDelimiters: VariableDelimiters;
    filterTree: FilterCondition;
    defaultValue: FilterCondition;
  } {
    return {
      availableVariables: [
        { category: 'Values', label: 'The best number', identifier: 'bestNumber', value: 42 },
        {
          category: 'Values',
          label: 'King in the North',
          identifier: 'kingInTheNorth',
          value: 'JSnow',
        },
        {
          category: 'Lists',
          label: 'Some array',
          identifier: 'someArray',
          value: ['plop', 'plip'],
        },
        {
          category: 'Lists',
          label: 'Poke-deck',
          identifier: 'pokedeck',
          value: ['pikachu', 'carapuce', 'evoli'],
        },
      ],
      filterTree: {
        column: 'my_col',
        operator: 'in',
        value: ['{{ someArray }}'],
      },
      variableDelimiters: { start: '{{', end: '}}' },
      defaultValue: { column: '', value: '', operator: 'eq' },
    };
  },

  computed: {
    filterTreeStringify() {
      return JSON.stringify(this.filterTree, null, 2);
    },
  },

  methods: {
    updateFilterTree(newFilterTree: FilterCondition) {
      this.filterTree = newFilterTree;
    },
  },
});
