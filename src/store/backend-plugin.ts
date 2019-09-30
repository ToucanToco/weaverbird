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
import { PipelineInterpolator } from '@/lib/templating';

import { StateMutation } from './mutations';
import { VQBnamespace, VQB_MODULE_NAME } from '@/store';
import { activePipeline } from '@/store/state';
import { pageOffset } from '@/lib/dataset/pagination';

export interface BackendService {
  /**
   * @param store the Vuex store hosted by the application
   *
   * @return a promise that holds the list of available collections
   */
  listCollections(store: Store<any>): BackendResponse<string[]>;
  /**
   * @param store the Vuex store hosted by the application
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

async function _updateDataset(store: Store<any>, service: BackendService, pipeline: Pipeline) {
  if (!store.state[VQB_MODULE_NAME].pipeline.length) {
    return;
  }
  try {
    store.commit(VQBnamespace('setLoading'), { isLoading: true });
    const { interpolateFunc, variables } = store.state[VQB_MODULE_NAME];
    if (interpolateFunc && variables && Object.keys(variables).length) {
      const interpolator = new PipelineInterpolator(interpolateFunc, variables);
      pipeline = interpolator.interpolate(pipeline);
    }
    const response = await service.executePipeline(
      store,
      pipeline,
      store.state[VQB_MODULE_NAME].pagesize,
      pageOffset(store.state[VQB_MODULE_NAME].pagesize, store.getters[VQBnamespace('pageno')]),
    );
    if (response.error) {
      store.commit(VQBnamespace('setBackendError'), {
        backendError: { type: 'error', message: response.error },
      });
    } else {
      store.commit(VQBnamespace('setDataset'), { dataset: response.data });
      // reset backend error to undefined:
      store.commit(VQBnamespace('setBackendError'), { backendError: undefined });
    }
  } catch (error) {
    store.commit(VQBnamespace('setBackendError'), {
      backendError: { type: 'error', message: error },
    });
  }
  store.commit(VQBnamespace('setLoading'), { isLoading: false });
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
    store.subscribe(async (mutation: StateMutation, state: any) => {
      if (
        mutation.type === VQBnamespace('selectStep') ||
        mutation.type === VQBnamespace('setCurrentDomain') ||
        mutation.type === VQBnamespace('deleteStep') ||
        mutation.type === VQBnamespace('setCurrentPage')
      ) {
        _updateDataset(store, service, activePipeline(state[VQB_MODULE_NAME]));
      }
    });
  };
}
