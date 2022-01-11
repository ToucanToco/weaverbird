import { DataSet } from '@/lib/dataset';
import { PipelinesScopeContext } from '@/lib/dereference-pipeline';
import { Pipeline } from '@/lib/steps';

export type BackendError = {
  type: 'error';
  index?: number; // step index if error target a specific step
  message: string;
};

export type BackendWarning = {
  type: 'warning';
  message: string;
};

export type BackendResponse<T> =
  | Promise<{ data: T; error?: never; warning?: BackendWarning[] }>
  | Promise<{ data?: never; error: BackendError[] }>;

export interface BackendService {
  /**
   * @param pipeline the pipeline to translate and execute on the backend
   * @param pipelines other pipelines, useful to resolve combination steps
   * @param limit if specified, a limit to be applied on the results. How is limit
   * is applied is up to the concrete implementor (either in the toolchain, the query
   * or afterwards on the resultset)
   * @param offset if specified, an offset to apply to resultset
   *
   * @return a promise that holds the result of the pipeline execution,
   * formatted as as `DataSet`
   */
  executePipeline(
    pipeline: Pipeline,
    pipelines: PipelinesScopeContext,
    limit: number,
    offset: number,
    sourceRowsSubset?: number | 'unlimited',
  ): BackendResponse<DataSet>;
}

/**
 * While no backend service is set, this will throw errors if we try to call its methods
 */
export const UnsetBackendService: BackendService = {
  executePipeline(): BackendResponse<DataSet> {
    /* istanbul ignore next */
    if (process.env.NODE_ENV === 'test') {
      // Act like a mock during tests
      return Promise.resolve({ data: { headers: [], data: [] } });
    }
    /* istanbul ignore next */
    throw new Error("Can't preview data because no backend service has been set");
  },
};
