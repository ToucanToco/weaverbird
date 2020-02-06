import { ConditionsEditor, ConditionForm } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('ConditionsEditor', module);

stories.add('default', () => ({
  template: `
    <div style="margin: 30px; overflow: auto">
      <ConditionsEditor :conditions-tree="conditionsTree" @conditionsTreeUpdated="updateConditionsTree"></ConditionsEditor>
      <pre style="margin-top: 30px;">{{ conditionsStringify }}</pre>
    </div>
  `,

  components: {
    ConditionsEditor,
    ConditionForm
  },

  data() {
    return {
      conditionsTree: {
        operator: 'and',
        conditions: [
          'you',
          'me',
        ],
        groups: [
          {
            operator: 'or',
            conditions: [
              'to be',
              'not to be',
            ],
          },
        ],
      },
    };
  },

  computed: {
    conditionsStringify() {
      return JSON.stringify(this.conditionsTree, null, 2);
    }
  },

  methods: {
    updateConditionsTree(newConditionsTree) {
      this.conditionsTree = newConditionsTree;
    },
  },
}));

stories.add('data filtering', () => ({
  template: `
    <div style="margin: 30px; overflow: auto">
      <ConditionsEditor :conditions-tree="conditionsTree" @conditionsTreeUpdated="updateConditionsTree">
        <template v-slot:default="slotProps">
          <ConditionForm :condition="slotProps.condition" @conditionUpdated="slotProps.updateCondition"></ConditionForm>
        </template>
      </ConditionsEditor>
      <pre style="margin-top: 30px;">{{ conditionsStringify }}</pre>
    </div>
  `,

  components: {
    ConditionForm,
    ConditionsEditor,
  },

  data() {
    return {
      conditionsTree: {
        operator: 'and',
        conditions: [
          {
            column: 'my_col',
            operator: 'eq',
            value: 'my_value',
          },
          {
            column: 'my_col',
            operator: 'eq',
            value: 'my_value',
          },
        ],
        groups: [
          {
            operator: 'or',
            conditions: [
              {
                column: 'my_sub_col',
                operator: 'eq',
                value: 'my_value',
              },
              {
                column: 'my_sub_col',
                operator: 'eq',
                value: 'my_value',
              },
            ],
          },
        ],
      },
    };
  },

  computed: {
    conditionsStringify() {
      return JSON.stringify(this.conditionsTree, null, 2);
    }
  },

  methods: {
    updateConditionsTree(newConditionsTree) {
      this.conditionsTree = newConditionsTree;
    },
  },
}));
