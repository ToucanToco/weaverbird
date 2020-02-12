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
import { pageOffset } from '@/lib/dataset/pagination';
import { Pipeline } from '@/lib/steps';
import { PipelineInterpolator } from '@/lib/templating';
import { VQB_MODULE_NAME, VQBnamespace } from '@/store';
import { activePipeline } from '@/store/state';

import { StateMutation } from './mutations';

type PipelinesScopeContext = {
  [pipelineName: string]: Pipeline;
};

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

/**
 * Dereference pipelines names in the current pipeline being edited, i.e.
 * replaces references to pipelines (by their names) to their corresponding
 * pipelines
 *
 * @param pipeline the pipeline to translate and execute on the backend
 * @param pipelines the pipelines stored in the Vuex store of the app, as an
 * object with the pipeline name as key and the correspondinng pipeline as value
 *
 * @return the dereferenced pipeline
 */
export function dereferencePipelines(
  pipeline: Pipeline,
  pipelines: PipelinesScopeContext,
): Pipeline {
  const dereferencedPipeline: Pipeline = [];
  for (const step of pipeline) {
    let newStep;
    if (step.name === 'append') {
      const pipelineNames = step.pipelines as string[];
      newStep = {
        ...step,
        pipelines: pipelineNames.map(p => dereferencePipelines(pipelines[p], pipelines)),
      };
    } else if (step.name === 'join') {
      const rightPipelineName = step.right_pipeline as string;
      newStep = {
        ...step,
        right_pipeline: dereferencePipelines(pipelines[rightPipelineName], pipelines),
      };
    } else {
      newStep = { ...step };
    }
    dereferencedPipeline.push(newStep);
  }
  return dereferencedPipeline;
}

export let backendService: BackendService; // set at plugin instantiation

function _preparePipeline(pipeline: Pipeline, store: Store<any>) {
  const { interpolateFunc, variables, pipelines } = store.state[VQB_MODULE_NAME];
  if (pipelines && Object.keys(pipelines).length) {
    pipeline = dereferencePipelines(pipeline, pipelines);
  }
  if (interpolateFunc && variables && Object.keys(variables).length) {
    const columnTypes = store.getters[VQBnamespace('columnTypes')];
    const interpolator = new PipelineInterpolator(interpolateFunc, variables, columnTypes);
    pipeline = interpolator.interpolate(pipeline);
  }
  return pipeline;
}

export function backendify(service: BackendService, target: 'listCollections' | 'executePipeline') {
  return async function(store: Store<any>, ...args: any[]) {
    try {
      store.commit(VQBnamespace('setLoading'), { isLoading: true });
      const response = await service[target](store, ...args);
      if (response.error) {
        store.commit(VQBnamespace('logBackendError'), {
          backendError: response.error,
        });
      }
      return response;
    } catch (error) {
      const response = { error: { type: 'error', message: error.toString() } };
      store.commit(VQBnamespace('logBackendError'), {
        backendError: response.error,
      });
      return response;
    } finally {
      store.commit(VQBnamespace('setLoading'), { isLoading: false });
    }
  };
}

async function _updateDataset(store: Store<any>, service: BackendService, pipeline: Pipeline) {
  if (!store.getters[VQBnamespace('pipeline')].length) {
    return;
  }
  pipeline = _preparePipeline(pipeline, store);
  const response = await backendify(service, 'executePipeline')(
    store,
    pipeline,
    store.state[VQB_MODULE_NAME].pagesize,
    pageOffset(store.state[VQB_MODULE_NAME].pagesize, store.getters[VQBnamespace('pageno')]),
  );
  if (!response.error) {
    store.commit(VQBnamespace('setDataset'), { dataset: response.data });
  }
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
        const pipeline = activePipeline(state[VQB_MODULE_NAME]);
        if (pipeline) {
          _updateDataset(store, service, pipeline);
        }
      }
    });
  };
}
