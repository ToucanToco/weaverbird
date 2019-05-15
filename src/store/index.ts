/**
 * store application main module
 */
import Vue from 'vue';
import Vuex from 'vuex';

import { Store, StoreOptions } from 'vuex';
import { VQBState, emptyState } from './state';
import getters from './getters';
import mutations from './mutations';

/**
 * Vuex store factory
 * Example usage:
 * `> setupStore({domains: ['foo', 'bar'], currentDomain: 'foo'})`
 * => will create an empty state, except for `domains` and `currentDomain` fields.
 *
 * @param initialState the parts of the state we want not to be empty at creation time.
 * @param plugins an optional list of store plugins (e.g. a backend database plugin)
 */
export function setupStore(
  initialState: Partial<VQBState> = {},
  plugins: Array<any> = [],
  autobind = false,
) {
  if (autobind) {
    Vue.use(Vuex);
  }
  const store: StoreOptions<VQBState> = {
    state: { ...emptyState, ...initialState },
    getters,
    mutations,
    plugins,
  };
  return new Store<VQBState>(store);
}
