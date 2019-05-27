import Vue from 'vue';
import Vuex from 'vuex';

import { Pipeline } from '@/lib/steps';
import { servicePluginFactory, setupStore } from '../dist/vue-query-builder.common.js';

import { MongoService } from './dbservice';
import App from './App.vue';

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

const mongoservice = new MongoService();
const mongoBackendPlugin = servicePluginFactory(mongoservice);

async function initApp() {
  const store = setupStore({ pipeline: initialPipeline, currentDomain: 'test-collection' }, [
    mongoBackendPlugin,
  ]);
  new Vue({
    store,
    render: h => h(App),
  }).$mount('#app');
  const collections = await mongoservice.listCollections();
  store.commit('setDomains', { domains: collections });
  const dataset = await mongoservice.executePipeline(initialPipeline);
  store.commit('setDataset', { dataset });
}

initApp();
