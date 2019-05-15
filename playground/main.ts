import Vue from 'vue';
import Vuex from 'vuex';

import { Pipeline } from '@/lib/steps';
import { setupStore } from '@/store';
import { servicePluginFactory } from '@/store/backend-plugin';
import App from './App.vue';
import { MongoService } from './dbservice';

Vue.use(Vuex);
Vue.config.productionTip = false;

const initialPipeline: Pipeline = [
  { name: 'domain', domain: 'test-collection' },
  { name: 'filter', column: 'Value4', value: 1, operator: 'gt' },
  { name: 'replace', search_column: 'Value2', to_replace: [[2, 20], [13, 24]] },
  { name: 'top', rank_on: 'Value2', sort: 'asc', limit: 3 },
  {
    name: 'pivot',
    index: ['Groups'],
    column_to_pivot: 'Label',
    value_column: 'Value2',
    agg_function: 'sum',
  },
  // { name: 'formula', new_column: "result", formula: "Value1 * Value2 + 10 * Value3" },
];

const mongoBackendPlugin = servicePluginFactory(new MongoService());
new Vue({
  store: setupStore({ pipeline: initialPipeline }, [mongoBackendPlugin]),
  render: h => h(App),
}).$mount('#app');
