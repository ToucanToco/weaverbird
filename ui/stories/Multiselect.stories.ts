import type { Meta, StoryFn } from '@storybook/vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import Multiselect from '@/components/stepforms/widgets/Multiselect.vue';
import type { ColumnTypeMapping } from '@/lib/dataset';
import type { FilterCondition } from '@/lib/steps';
import type { AvailableVariable, VariableDelimiters } from '@/lib/variables';

Vue.use(PiniaVuePlugin);

export default {
  component: Multiselect,
} as Meta<typeof Multiselect>;

export const Default: StoryFn<typeof Multiselect> = () => ({
  pinia: createPinia(),
  template: `
    <div style="margin: 30px; overflow: auto">
      <Multiselect
        :filterTree="filterTree"
        :columnTypes="columnTypes"
        @filterTreeUpdated="updateFilterTree"
      />
      <pre style="margin-top: 30px;">{{ filterTreeStringify }}</pre>
    </div>
  `,

  components: {
    Multiselect,
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

export const WithVariables: StoryFn<typeof Multiselect> = () => ({
  pinia: createPinia(),
  template: `
    <div>
      <Multiselect
        :filter-tree="filterTree"
        @filterTreeUpdated="updateFilterTree"
        :available-variables="availableVariables"
        :variableDelimiters="variableDelimiters"
        :trustedVariableDelimiters="trustedVariableDelimiters"
      />
      <pre style="margin-top: 30px;">{{ filterTreeStringify }}</pre>
    </div>
  `,

  components: {
    Multiselect,
  },

  data(): {
    availableVariables: AvailableVariable[];
    variableDelimiters: VariableDelimiters;
    trustedVariableDelimiters: VariableDelimiters;
    filterTree: FilterCondition;
    defaultValue: FilterCondition;
  } {
    return {
      availableVariables: [
        {
          category: 'Values',
          label: 'The best number',
          identifier: 'bestNumber',
          value: 42,
        },
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
        {
          category: 'Trusted',
          label: 'Date',
          identifier: 'date',
          value: '27/12/2093',
          trusted: true,
        },
      ],
      filterTree: {
        column: 'my_col',
        operator: 'in',
        value: ['<%= someArray %>'],
      },
      variableDelimiters: { start: '<%=', end: '%>' },
      trustedVariableDelimiters: { start: '{{', end: '}}' },
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
