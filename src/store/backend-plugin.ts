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

export interface BackendService<Output> {
  /**
   * @return a promise that holds the list of available collections
   */
  listCollections(): Promise<Array<string>>;
  /**
   * @param pipeline the pipeline to translate and execute on the backend
   * @return a promise that holds the result of the pipeline execution
   */
  executePipeline(pipeline: Pipeline): Promise<Output>;
  /**
   * transforms a raw backend result into a `DataSet` object.
   *
   * @param resultset the result of the pipeline execution
   * @return the input resultset, transformed as a `DataSet` object.
   */
  formatDataset(resultset: Output): DataSet;
}

async function _updateDataset<O>(
  store: Store<VQBState>,
  service: BackendService<O>,
  pipeline: Pipeline,
) {
  const results = await service.executePipeline(pipeline);
  store.commit('setDataset', { dataset: service.formatDataset(results) });
}

/**
 * instantiates a plugin that hooks store mutations to corresponding
 * backend operations.
 *
 * @param service the actual database backend service instance
 * @return a plugin function usable in the `plugins` field of the store.
 */
export function servicePluginFactory<O>(service: BackendService<O>) {
  return (store: Store<VQBState>) => {
    store.subscribe(async (mutation: StateMutation, state: VQBState) => {
      if (mutation.type === 'setPipeline') {
        _updateDataset(store, service, mutation.payload.pipeline);
      } else if (mutation.type === 'selectStep') {
        _updateDataset(store, service, activePipeline(state));
      }
    });
  };
}
