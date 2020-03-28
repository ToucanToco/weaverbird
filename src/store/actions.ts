import { ActionContext, ActionTree } from 'vuex';

import { VQBnamespace } from '@/store';

import { computeUniques } from './backend-plugin';
import { VQBState } from './state';

const actions: ActionTree<VQBState, any> = {
  selectPipeline({ commit }, { name }: { name: string }) {
    commit('setCurrentPipelineName', { name: name });

    // Reset selected step to last one
    commit('selectStep', { index: -1 });
  },

  /**
   * load unique values for a given column
   */
  async loadColumnUniqueValues(
    store: ActionContext<VQBState, any>,
    { column }: { column: string },
  ) {
    const newDataset = await computeUniques(store, column);
    if (newDataset !== null) {
      store.commit(VQBnamespace('setDataset'), { dataset: newDataset });
    }
  },
};

export default actions;
