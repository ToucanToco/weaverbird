import { ActionContext, ActionTree } from 'vuex';

import { addLocalUniquesToDataset } from '@/lib/dataset/helpers.ts';
import { pageOffset } from '@/lib/dataset/pagination';

import { backendService } from './backend-plugin';
import { preparePipeline, VQBState } from './state';
/**
 * Action wrapper so that the state loading is set to true at the start of
 *
 */
function loading(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(context: ActionContext<VQBState, any>, ...args: any[]) {
    context.commit('setLoading', { isLoading: true });
    await originalMethod(context, ...args);
    context.commit('setLoading', { isLoading: false });
  };

  return descriptor;
}

/**
 * HACK: this class is just a temporary wrapper to be able to use decorators.
 * We'll export its prototype afterwards.
 */
class Actions {
  selectPipeline(context: ActionContext<VQBState, any>, { name }: { name: string }) {
    context.commit('setCurrentPipelineName', { name: name });

    // Reset selected step to last one
    context.commit('selectStep', { index: -1 });
  }

  @loading
  async updateDataset(context: ActionContext<VQBState, any>) {
    const response = await backendService.executePipeline(
      preparePipeline(context.getters.activePipeline, context.state),
      context.state.pagesize,
      pageOffset(context.state.pagesize, context.getters.pageno),
    );
    if (!response.error) {
      context.commit('setDataset', {
        dataset: addLocalUniquesToDataset(response.data),
      });
    }
  }
}

const actions: ActionTree<VQBState, any> = {};
Object.assign(actions, Actions.prototype);
export default actions;
