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

import { BackendResponse } from '@/lib/backend-response';
import { DataSet } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';

export interface BackendService {
  /**
   * @param store the Vuex store hosting the application
   *
   * @return a promise that holds the list of available collections
   */
  listCollections(store: Store<any>): BackendResponse<string[]>;
  /**
   * @param store the Vuex store hosting the application
   * @param pipeline the pipeline to translate and execute on the backend
   * @param limit if specified, a limit to be applied on the results. How is limit
   * is applied is up to the concrete implementor (either in the toolchain, the query
   * or afterwareds on the resultset)
   * @param offset if specified, an offset to apply to resultset
   *
   * @return a promise that holds the result of the pipeline execution,
   * formatted as as `DataSet`
   */
  executePipeline(
    store: Store<any>,
    pipeline: Pipeline,
    limit: number,
    offset: number,
  ): BackendResponse<DataSet>;
}

/**
 * `BackendServiceInternal` is a copy of `BackendService` but without the `store` param.
 * We will use the service in actions of "vqb" vuex module.
 * Consequently we won't be able to pass to the service the hosting store.
 * We are then force to build an "internal version" of this service with the hosting store wrapped inside.
 */
interface BackendServiceInternal {
  listCollections(): BackendResponse<string[]>;
  executePipeline(pipeline: Pipeline, limit: number, offset: number): BackendResponse<DataSet>;
}

export let backendService: BackendServiceInternal; // set at plugin instantiation

/**
 * `backendify` is a wrapper around backend service functions that:
 *   - sets the `isRequestOnGoing: true` property on the store at the beginning,
 *   - logs the error in the store if any,
 *   - sets the `isRequestOnGoing: false` property on the store at the end.
 */
export function backendify(target: Function, store: Store<any>) {
  return async function(this: BackendService | void, ...args: any[]) {
    try {
      store.commit('vqb/toggleRequestOnGoing', { isRequestOnGoing: true });
      const response = await target.bind(this)(...args);
      if (response.error) {
        store.commit('vqb/logBackendError', {
          backendError: response.error,
        });
      }
      return response;
    } catch (error) {
      const response = { error: { type: 'error', message: error.toString() } };
      store.commit('vqb/logBackendError', {
        backendError: response.error,
      });
      return response;
    } finally {
      store.commit('vqb/toggleRequestOnGoing', { isRequestOnGoing: false });
    }
  };
}

/**
 * instantiates a plugin that hooks store mutations to corresponding
 * backend operations.
 *
 * @param service the actual database backend service instance
 * @return a plugin function usable in the `plugins` field of the store.
 */
export function servicePluginFactory(service: BackendService) {
  return (store: Store<any>) => {
    /**
     * `store`  is the hosting store.
     * We want to expose `backendService` to the vqb's actions module.
     * But in the vqb's actions module we will not have access to the hosting store.
     * Then we "wrap" the hosting store inside the backendService.
     * Also, we `backendify` all methods of backendService.
     */
    backendService = {
      listCollections: backendify(() => service.listCollections(store), store).bind(service),
      executePipeline: backendify(
        (pipeline: Pipeline, limit: number, offset: number) =>
          service.executePipeline(store, pipeline, limit, offset),
        store,
      ).bind(service),
    };

    // TODO: replace this `store.subscribe` by a watcher on the appropriate state's properties
    // FIXME: we hard-code `vqb/` namespace, instead of importing `VQBNamespace` from './index'.
    // Importing `VQBNamespace` from './index' create a circular dependency.
    // This could be fixed by importing `VQBNamespace` from an utils, but I think the TODO above might fix directly this issue.
    store.subscribe(async (mutation: any) => {
      if (
        mutation.type === 'vqb/selectStep' ||
        mutation.type === 'vqb/setCurrentDomain' ||
        mutation.type === 'vqb/deleteStep' ||
        mutation.type === 'vqb/setCurrentPage'
      ) {
        store.dispatch('vqb/updateDataset');
      }
    });
  };
}
