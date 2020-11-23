import { DataSet } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';

export type BackendError = {
  type: 'error';
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
   * @return a promise that holds the list of available collections
   */
  listCollections(): BackendResponse<string[]>;
  /**
   * @param pipeline the pipeline to translate and execute on the backend
   * @param limit if specified, a limit to be applied on the results. How is limit
   * is applied is up to the concrete implementor (either in the toolchain, the query
   * or afterwards on the resultset)
   * @param offset if specified, an offset to apply to resultset
   *
   * @return a promise that holds the result of the pipeline execution,
   * formatted as as `DataSet`
   */
  executePipeline(pipeline: Pipeline, limit: number, offset: number): BackendResponse<DataSet>;
}

/**
 * While no backend service is set, this will throw errors if we try to call its methods
 */
export const UnsetBackendService: BackendService = {
  listCollections() {
    throw new Error("Can't list collections because no backend service has been set");
  },
  executePipeline() {
    throw new Error("Can't preview data because no backend service has been set");
  },
};
