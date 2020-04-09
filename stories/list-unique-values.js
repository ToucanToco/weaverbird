import { storiesOf } from '@storybook/vue';

import { ListUniqueValues } from '../dist/storybook/components';
const stories = storiesOf('ListUniqueValues', module);

stories.add('default', () => ({
  components: { ListUniqueValues },
  data(){
    return {
        options: [
            {value: 'France', count: 12},
            {value: 'UK', count: 1},
            {value: 'China', count: 14},
            {value: 'Framboise', count: 10},
            {value: 'Italy', count: 23},
        ],
        filter: { column: "col1", operator: "in", value: []},
        loaded: false,
    }
  },
  template: `<div><ListUniqueValues :loaded="loaded" :filter="filter" @input="filter = $event" :options="options"/></div>`,
}));
