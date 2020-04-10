import { storiesOf } from '@storybook/vue';
import Vuex from 'vuex';
import Vue from 'vue';

import { ListUniqueValues, registerModule, VQBnamespace } from '../dist/storybook/components';
const stories = storiesOf('ListUniqueValues', module);
Vue.use(Vuex)

stories.add('default', () => ({
  store: new Vuex.Store({}),
  created: function() {
    registerModule(this.$store, {
      dataset: {
        headers: [{name: 'col1', isUniqueValuesLoading: false}],
        data: [],
      }
    });
  },
  components: { ListUniqueValues },
  methods: {
    loadAllValues(){
      this.$store.commit(VQBnamespace('setUniqueValuesLoading'), { isLoading: true, column: 'col1' });
      // simulate the call to get all unique values of dataset:
      setTimeout(() => {
        this.options = [
          {value: 'Germany', count: 120},
          {value: 'US', count: 34},
          {value: 'Italy', count: 33},
          {value: 'China', count: 24},
          {value: 'France', count: 12},
          {value: 'Framboise', count: 10},
          {value: 'UK', count: 1},
        ];
        this.loaded = false;
        this.$store.commit(VQBnamespace('setUniqueValuesLoading'), { isLoading: false, column: 'col1' });
      }, 3000); // the call take 3sec
    }
  },
  data(){
    return {
        options: [
            {value: 'Italy', count: 23},
            {value: 'China', count: 14},
            {value: 'France', count: 12},
            {value: 'Framboise', count: 10},
            {value: 'UK', count: 1},
        ],
        filter: { column: "col1", operator: "in", value: []},
        loaded: true,
    }
  },
  template: `<div style="width: 200px">
    <ListUniqueValues :loaded="loaded" :filter="filter" @input="filter = $event" :options="options" @loadAllValues="loadAllValues"/>
  </div>`,
}));
