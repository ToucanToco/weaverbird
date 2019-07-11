/**
 * exports the list of store getters.
 */

import { VQBState, activePipeline, inactivePipeline } from './state';

export default {
  /**
   * the part of the pipeline that is currently selected.
   */
  activePipeline,
  /**
   * the list of current dataset's colum names.
   **/
  columnNames: (state: VQBState) => state.dataset.headers.map(col => col.name),
  /**
   * the list of dataset's column headers.
   */
  columnHeaders: (state: VQBState) => state.dataset.headers,
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
   * helper that is True if pipeline is empty or only contain a domain step.
   */
  isPipelineEmpty: (state: VQBState) => state.pipeline.length <= 1,
  /**
   * helper that is True if this step is after the last currently active step.
   */
  isStepDisabled: (state: VQBState) => (index: number) =>
    state.selectedStepIndex >= 0 && index > state.selectedStepIndex,
  /**
   * selected columns in the dataviewer (materialized by a styled focus)
   */
  selectedColumns: (state: VQBState) => state.selectedColumns,
  /**
   * Get the step config of the pipeline based on its index
   */
  stepConfig: (state: VQBState) => (index: number) => state.pipeline[index],
};
