/**
 * store application main module
 */
import Vue from 'vue';
import Vuex from 'vuex';

import { Store, StoreOptions } from 'vuex';
import { namespace } from 'vuex-class';
import { VQBState, emptyState } from './state';
import getters from './getters';
import mutations from './mutations';

const VQB_MODULE_NAME = '__vqb__';

export function namespaced(prop: string) {
  return `${VQB_MODULE_NAME}/${prop}`;
}

export function buildStoreModule(initialState: Partial<VQBState> = {}) {
  return {
    namespaced: true,
    state: { ...emptyState, ...initialState },
    getters,
    mutations,
  };
}

export function registerModule(rootStore: Store<any>, initialState: Partial<VQBState> = {}) {
  rootStore.registerModule(VQB_MODULE_NAME, buildStoreModule(initialState));
}

export const VQBModule = namespace(VQB_MODULE_NAME);

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
  plugins: any[] = [],
  autobind = false,
) {
  if (autobind) {
    Vue.use(Vuex);
  }
  const store: StoreOptions<VQBState> = {
    modules: {
      [VQB_MODULE_NAME]: buildStoreModule(initialState),
    },
    plugins,
  };
  return new Store<VQBState>(store);
}
