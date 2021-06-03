// export lib entrypoints
export { filterOutDomain, mongoToPipe } from './lib/pipeline';
export { getTranslator } from './lib/translators';
export { mongoResultsToDataset, inferTypeFromDataset } from './lib/dataset/mongo';
export { pandasDataTableToDataset } from './lib/dataset/pandas';
export { setAvailableCodeEditors } from './components/code-editor';

// export store entrypoints
export { dereferencePipelines, getPipelineNamesReferencing } from '@/lib/dereference-pipeline';
export {
  setupStore,
  registerModule,
  unregisterModule,
  VQBModule,
  VQBnamespace,
  VQB_MODULE_NAME,
} from '@/store';

// export Vue components
import DataViewer from '@/components/DataViewer.vue';
import FilterEditor from '@/components/FilterEditor.vue';
import PipelineSelector from '@/components/PipelineSelector.vue';
import QueryBuilder from '@/components/QueryBuilder.vue';
import Vqb from '@/components/Vqb.vue';

export {
  // All-in-one component
  Vqb,
  // Main sub-components
  DataViewer,
  QueryBuilder,
  PipelineSelector,
  // Utility components
  FilterEditor,
};

// @ts-ignore


import {WorkerExecutor} from "@/webworker/WorkerExecutor";
export {WorkerExecutor}

// export helpers/utils
export { exampleInterpolateFunc } from '@/lib/templating';

// export directives
export { resizable } from '@/directives/resizable/resizable';

