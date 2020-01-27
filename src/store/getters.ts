/**
 * exports the list of store getters.
 */
import _ from 'lodash';

import { activePipeline, inactivePipeline, VQBState } from './state';

export default {
  /**
   * the part of the pipeline that is currently selected.
   */
  activePipeline,

  /**
   * current backend's error message
   */
  backendErrorMessages: (state: VQBState) => state.backendErrors,
  /**
   * the list of current dataset's colum names.
   **/
  columnNames: (state: VQBState) => state.dataset.headers.map(col => col.name),
  /**
   * the list of dataset's column headers.
   */
  columnHeaders: (state: VQBState) => state.dataset.headers,
  /**
   * return a mapping { columnName → columnType }
   */
  columnTypes: (state: VQBState) =>
    _.fromPairs(state.dataset.headers.map(col => [col.name, col.type])),
  /**
   * a direct "usable" index (i.e. convert "-1" to a positive one) of last active step.
   */
  computedActiveStepIndex: (state: VQBState) =>
    state.selectedStepIndex === -1 ? state.pipeline.length - 1 : state.selectedStepIndex,
  /**
   * the first step of the pipeline. Since it's handled differently in the UI,
   * it's useful to be able to access it directly.
   */
  domainStep: (state: VQBState) => state.pipeline[0],
  /**
   * the part of the pipeline that is currently disabled.
   */
  inactivePipeline,
  /**
   * helper that is True if dataset's data is empty.
   */
  isDatasetEmpty: (state: VQBState) => state.dataset.data.length === 0,
  /**
   * helper that tell us if we are editing a step
   */
  isEditingStep: (state: VQBState) => state.currentStepFormName !== undefined,
  /**
   * helper that is True if pipeline is empty or only contain a domain step.
   */
  isPipelineEmpty: (state: VQBState) => state.pipeline.length <= 1,
  /**
   * helper that is True if this step is after the last currently active step.
   */
  isStepDisabled: (state: VQBState) => (index: number) =>
    state.selectedStepIndex >= 0 && index > state.selectedStepIndex,
  /**
   * Return current page number
   */
  pageno: (state: VQBState) =>
    state.dataset.paginationContext ? state.dataset.paginationContext.pageno : 1,
  /**
   * Return pipelines save in store
   */
  pipelines: (state: VQBState) => state.pipelines,
  /**
   * Return true if an error occured in the backend
   */
  thereIsABackendError: (state: VQBState) => state.backendErrors.length > 0,
  /**
   * selected columns in the dataviewer (materialized by a styled focus)
   */
  selectedColumns: (state: VQBState) => state.selectedColumns,
  /**
   * Get the step config of the pipeline based on its index
   */
  stepConfig: (state: VQBState) => (index: number) => state.pipeline[index],
  /**
   * Return the app translator name
   */
  translator: (state: VQBState) => state.translator,
};
