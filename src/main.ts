// export lib entrypoints
export { filterOutDomain, mongoToPipe } from './lib/pipeline';
export { getTranslator } from './lib/translators';
export { mongoResultsToDataset, inferTypeFromDataset } from './lib/dataset/mongo';
export { pandasDataTableToDataset } from './lib/dataset/pandas';
export { setAvailableCodeEditors } from './components/code-editor';
export { defineSendAnalytics } from './lib/send-analytics';

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

import '@/lib/icons';

// export Vue components
import DataViewer from '@/components/DataViewer.vue';
import FilterEditor from '@/components/FilterEditor.vue';
import Pagination from '@/components/Pagination.vue';
import PipelineSelector from '@/components/PipelineSelector.vue';
import QueryBuilder from '@/components/QueryBuilder.vue';
import DateRangeInput from '@/components/stepforms/widgets/DateComponents/DateRangeInput.vue';
import NewDateInput from '@/components/stepforms/widgets/DateComponents/NewDateInput.vue';
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
  NewDateInput,
  DateRangeInput,
  Pagination,
};

// export helpers/utils
export { exampleInterpolateFunc } from '@/lib/templating';
export { transformValueToDateRange } from '@/components/DatePicker/transform-value-to-date-or-range';
export { dateRangeToString } from '@/lib/dates';

// export directives
export { resizable } from '@/directives/resizable/resizable';
