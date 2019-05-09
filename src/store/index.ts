import { Store, StoreOptions } from 'vuex';

import { DataSet } from '@/lib/dataset';
import { Pipeline } from '@/lib/steps';

interface VQBState {
  dataset: DataSet;
  pipeline: Pipeline;
}

const store: StoreOptions<VQBState> = {
  state: {
    dataset: {
      headers: [],
      data: [],
    },
    pipeline: [],
  },
};

export default new Store<VQBState>(store);
