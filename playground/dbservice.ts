import { Store } from 'vuex';
import { getTranslator } from '@/lib/translators';
import { Pipeline } from '@/lib/steps';
import { filterOutDomain } from '@/lib/pipeline';
import { MongoStep, Mongo36Translator } from '@/lib/translators/mongo';
import { MongoResults, mongoResultsToDataset } from '@/lib/dataset/mongo';
import { VQBState, activePipeline } from '@/store';

interface DBService<Input, Output> {
  listCollections(): Promise<Array<string>>;
  executeQuery(query: Input, collection: string): Promise<Output>;
}

export class MongoService implements DBService<Array<MongoStep>, MongoResults> {
  readonly translator!: Mongo36Translator;

  constructor() {
    this.translator = <Mongo36Translator>getTranslator('mongo36');
  }
  async listCollections(): Promise<Array<string>> {
    const response = await fetch('/collections');
    return response.json();
  }
  async executeQuery(query: Array<MongoStep>, collection: string): Promise<MongoResults> {
    const response = await fetch('/query', {
      method: 'POST',
      body: JSON.stringify({ query, collection }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }
}

const service = new MongoService();

async function _updateDataset(store: Store<VQBState>, service: MongoService, pipeline: Pipeline) {
  const { domain, pipeline: subpipeline } = filterOutDomain(pipeline);
  const results = await service.executeQuery(service.translator.translate(subpipeline), domain);
  store.commit('setDataset', { dataset: mongoResultsToDataset(results) });
}

type PipelineMutation = {
  type: 'setPipeline';
  payload: Pick<VQBState, 'pipeline'>;
};

type SelectedStepMutation = {
  type: 'selectStep';
  payload: { index: number };
};

type StateMutation = PipelineMutation | SelectedStepMutation;

export function mongoServicePlugin(store: Store<VQBState>) {
  store.subscribe(async (mutation: StateMutation, state: VQBState) => {
    if (mutation.type === 'setPipeline') {
      _updateDataset(store, service, mutation.payload.pipeline);
    } else if (mutation.type === 'selectStep') {
      _updateDataset(store, service, activePipeline(state));
    }
  });
}
