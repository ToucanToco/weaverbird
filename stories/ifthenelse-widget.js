import { IfThenElseWidget } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

import Vuex from 'vuex';

const stories = storiesOf('Widgets/IfThenElseWidget', module);

stories.add('simple', () => ({
  template: `
    <div>
      <IfThenElseWidget isRoot :value="value" @input="updateValue" />
      <pre>{{ valueStringify }}</pre>
    </div>
  `,

  store: new Vuex.Store(),

  components: {
    IfThenElseWidget,
  },

  computed: {
    valueStringify() {
      return JSON.stringify(this.value, null, 2);
    },
  },

  data() {
    return {
      value: {
        if: {
          and: [
            {
              column: 'foo',
              value: 1,
              operator: 'ge',
            },
            {
              column: 'bar',
              value: 'Hello World',
              operator: 'eq',
            },
          ],
        },
        then: 'Oh yes!',
        else: 'Oh no!',
      },
    };
  },

  methods: {
    updateValue(newValue) {
      this.value = newValue;
    },
  },
}));
