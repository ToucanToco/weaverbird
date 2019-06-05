/**
 * base helpers to create a database backend service.
 *
 * Expose the expected interface of a `BackendService` plugin
 * and provide a simple factory to create a `backend service` plugin.
 *
 * This plugin will hook up on store mutations to call corresponding operations
 * on an actual database.
 */
import { Store } from 'vuex';

import { DataSet } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';

import { StateMutation } from './mutations';
import { VQBState, activePipeline } from '@/store/state';

export interface BackendService {
  /**
   * @return a promise that holds the list of available collections
   */
  listCollections(): Promise<string[]>;
  /**
   * @param pipeline the pipeline to translate and execute on the backend
   * @return a promise that holds the result of the pipeline execution,
   * formatted as as `DataSet`
   */
  executePipeline(pipeline: Pipeline): Promise<DataSet>;
}

async function _updateDataset(store: Store<VQBState>, service: BackendService, pipeline: Pipeline) {
  const dataset = await service.executePipeline(pipeline);
  store.commit('setDataset', { dataset });
}

/**
 * instantiates a plugin that hooks store mutations to corresponding
 * backend operations.
 *
 * @param service the actual database backend service instance
 * @return a plugin function usable in the `plugins` field of the store.
 */
export function servicePluginFactory(service: BackendService) {
  return (store: Store<VQBState>) => {
    store.subscribe(async (mutation: StateMutation, state: VQBState) => {
      if (
        mutation.type === 'setPipeline' ||
        mutation.type === 'selectStep' ||
        mutation.type === 'setCurrentDomain' ||
        mutation.type === 'deleteStep'
      ) {
        _updateDataset(store, service, activePipeline(state));
      }
    });
  };
}
