import { ActionContext, ActionTree } from 'vuex';

import { pageOffset } from '@/lib/dataset/pagination';

import { backendService } from './backend-plugin';
import { preparePipeline, VQBState } from './state';

const actions: ActionTree<VQBState, any> = {
  selectPipeline(context: ActionContext<VQBState, any>, { name }: { name: string }) {
    context.commit('setCurrentPipelineName', { name: name });

    // Reset selected step to last one
    context.commit('selectStep', { index: -1 });
  },

  async updateDataset(context: ActionContext<VQBState, any>) {
    const response = await backendService.executePipeline(
      preparePipeline(context.getters.activePipeline, context.state),
      context.state.pagesize,
      pageOffset(context.state.pagesize, context.getters.pageno),
    );
    if (!response.error) {
      context.commit('setDataset', {
        dataset: response.data,
      });
    }
  },
};

export default actions;
