import { defineStore } from 'pinia';

import actions, { type VQBActions } from './actions';
import getters, { type VQBGetters } from './getters';
import type { VQBState } from './state';
import { emptyState } from './state';

export type { VQBActions, VQBGetters };


/**
 * the default VQB namespace name
 */
export const VQB_MODULE_NAME = 'vqb';

export const VQBModule = defineStore(VQB_MODULE_NAME, {
  state: () => ({ ...emptyState() }),
  getters,
  actions,
});

export function setupVQBStore(initialState: Partial<VQBState> = {}) {
  VQBModule().$patch({
    ...emptyState(),
    ...initialState,
  });
}

export function useVQBStore() {
  return VQBModule();
}
