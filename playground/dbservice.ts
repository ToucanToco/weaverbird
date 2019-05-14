import { getTranslator } from '@/lib/translators';
import { Pipeline } from '@/lib/steps';
import { filterOutDomain } from '@/lib/pipeline';
import { MongoStep, Mongo36Translator } from '@/lib/translators/mongo';
import { MongoResults, mongoResultsToDataset } from '@/lib/dataset/mongo';

import { BackendService } from '@/store/backend-plugin';
import { DataSet } from '@/lib/dataset';

export class MongoService implements BackendService {
  readonly translator!: Mongo36Translator;

  constructor() {
    this.translator = <Mongo36Translator>getTranslator('mongo36');
  }

  async listCollections(): Promise<Array<string>> {
    const response = await fetch('/collections');
    return response.json();
  }

  async executePipeline(pipeline: Pipeline): Promise<DataSet> {
    const { domain, pipeline: subpipeline } = filterOutDomain(pipeline);
    const rset = await this.executeQuery(this.translator.translate(subpipeline), domain);
    return mongoResultsToDataset(rset);
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
