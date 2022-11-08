import type { Meta, StoryFn } from '@storybook/vue';

import ConditionsEditor from '@/components/ConditionsEditor/ConditionsEditor.vue';
import type { AbstractFilterTree } from '@/components/ConditionsEditor/tree-types';

export default {
  title: 'ConditionsEditor',
  component: ConditionsEditor,
} as Meta<ConditionsEditor>;

export const EmptySlot: StoryFn<ConditionsEditor> = () => ({
  template: `
    <div style="margin: 30px; overflow: auto">
      <ConditionsEditor
        :conditions-tree="conditionsTree"
        :defaultValue="defaultValue"
        @conditionsTreeUpdated="updateConditionsTree"
      />
      <pre style="margin-top: 30px;">{{ conditionsStringify }}</pre>
    </div>
  `,

  components: {
    ConditionsEditor,
  },

  data(): {
    conditionsTree: AbstractFilterTree;
  } {
    return {
      conditionsTree: {
        operator: 'and',
        conditions: ['you', 'me'],
        groups: [
          {
            operator: 'or',
            conditions: ['to be', 'not to be'],
          },
        ],
      },
    };
  },

  computed: {
    conditionsStringify() {
      return JSON.stringify(this.conditionsTree, null, 2);
    },
  },

  methods: {
    updateConditionsTree(newConditionsTree: AbstractFilterTree) {
      this.conditionsTree = newConditionsTree;
    },
  },
});
