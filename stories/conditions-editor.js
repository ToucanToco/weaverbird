import { ConditionsEditor, ConditionForm } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('ConditionsEditor', module);

stories.add('default', () => ({
  template: `\
    <div style="margin: 30px; overflow: auto">
      <ConditionsEditor :conditions-tree="conditionsTree" @conditionsUpdated="updateConditions"></ConditionsEditor>
    </div>\
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
          {
            column: 'my_col',
            comparison: 'equal',
            value: 'my_value',
          },
          {
            column: 'my_col',
            comparison: 'equal',
            value: 'my_value',
          },
        ],
        groups: [
          {
            operator: 'or',
            conditions: [
              {
                column: 'my_sub_col',
                comparison: 'equal',
                value: 'my_value',
              },
              {
                column: 'my_sub_col',
                comparison: 'equal',
                value: 'my_value',
              },
            ],
          },
        ],
      },
    };
  },

  methods: {
    updateConditions(newConditions) {
      this.conditionsTree = newConditions;
    },
  },
}));

stories.add('data permission', () => ({
  template: `\
    <div style="margin: 30px; overflow: auto">
      <ConditionsEditor :conditions-tree="conditionsTree" @conditionsTreeUpdated="updateConditionsTree">
        <template v-slot:default="slotProps">
          <ConditionForm :condition="slotProps.condition" @conditionUpdated="slotProps.updateCondition"></ConditionForm>
        </template>
      </ConditionsEditor>
    </div>\
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
            comparison: 'equal',
            value: 'my_value',
          },
          {
            column: 'my_col',
            comparison: 'equal',
            value: 'my_value',
          },
        ],
        groups: [
          {
            operator: 'or',
            conditions: [
              {
                column: 'my_sub_col',
                comparison: 'equal',
                value: 'my_value',
              },
              {
                column: 'my_sub_col',
                comparison: 'equal',
                value: 'my_value',
              },
            ],
          },
        ],
      },
    };
  },

  methods: {
    updateConditionsTree(newConditionsTree) {
      this.conditionsTree = newConditionsTree;
    },
  },
}));
