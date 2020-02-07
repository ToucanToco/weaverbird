// export lib entrypoints
export { filterOutDomain, mongoToPipe } from './lib/pipeline';
export { getTranslator } from './lib/translators';
export { mongoResultsToDataset, inferTypeFromDataset } from './lib/dataset/mongo';
export { setCodeEditor } from './components/code-editor';

// export store entrypoints
export { servicePluginFactory, dereferencePipelines } from '@/store/backend-plugin';
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
import QueryBuilder from '@/components/QueryBuilder.vue';
import Vqb from '@/components/Vqb.vue';
export { DataViewer, QueryBuilder, Vqb };
