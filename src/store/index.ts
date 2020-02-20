/**
 * Store application main module
 *
 * It exposes everything needed to embed the VQB store in a host store,
 * e.g. `registerModule(hostStore, initialState)` to register a VQB store
 * and `unregisterModule()` for the dual operation.
 *
 * A `vuex-class`'s namespace is exported as the '`VQBModule` symbol. It can therefore
 * be used as a decorator inside a `Vue` component, .e.g.:
 *
 * ```typescript
 * @Component
 * class MyComponent extends Vue {
 *    @VQBModule.Getter pipeline!: Pipeline;
 *    // ...
 * }
 * ```
 */
import Vue from 'vue';
import Vuex, { Store, StoreOptions } from 'vuex';
import { namespace } from 'vuex-class';

import actions from './actions';
import getters from './getters';
import mutations from './mutations';
import { emptyState, VQBState } from './state';

/**
 * the default VQB namespace name
 */
export const VQB_MODULE_NAME = 'vqb';

/**
 * helper to compute the fully qualified property name.
 * e.g. `vqb/pipeline`, `vqb/selecedIndex`
 */
export const VQBnamespace = function(prop: string) {
  return `${VQB_MODULE_NAME}/${prop}`;
};

export const VQBModule = namespace(VQB_MODULE_NAME);

export function buildStoreModule(initialState: Partial<VQBState> = {}) {
  const store = {
    namespaced: true,
    state: { ...emptyState(), ...initialState },
    getters,
    mutations,
    actions,
  };
  return store;
}

/**
 * register a VQBModule inside a host Vuex store using `VQB_MODULE_NAME` as key.
 */
export function registerModule(rootStore: Store<any>, initialState: Partial<VQBState> = {}) {
  rootStore.registerModule(VQB_MODULE_NAME, buildStoreModule(initialState));
}

/**
 * unregister a VQBModule from a host inside a host Vuex store using `VQB_MODULE_NAME` as key.
 */
export function unregisterModule(rootStore: Store<any>) {
  rootStore.unregisterModule(VQB_MODULE_NAME);
}

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
    actions,
    state: { ...emptyState(), ...initialState },
    getters,
    mutations,
    plugins,
  };
  return new Store<VQBState>(store);
}
