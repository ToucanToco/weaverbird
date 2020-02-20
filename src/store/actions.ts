import { ActionTree } from 'vuex';

import { VQBState } from './state';

const actions: ActionTree<VQBState, any> = {
  selectPipeline({ commit }, { name }: { name: string }) {
    commit('setCurrentPipelineName', { name: name });

    // Reset selected step to last one
    commit('selectStep', { index: -1 });
  },
};

export default actions;
