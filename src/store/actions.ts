import { ActionContext, ActionTree } from 'vuex';

import { addLocalUniquesToDataset, updateLocalUniquesFromDatabase } from '@/lib/dataset/helpers.ts';
import { pageOffset } from '@/lib/dataset/pagination';
import { Pipeline } from '@/lib/steps';

import { backendService } from './backend-plugin';
import { preparePipeline, VQBState } from './state';

/**
 * Action wrapper so that the state loading is set to true at the start of
 * In weaverbird there are two loading states:
 * - a "global" loading state which means that the whole dataset is currently loading
 * - a "column" loading state which means that unique values of this column are currently loading
 */
function loading(column = false) {
  return function loading(_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    if (!column) {
      descriptor.value = async function(context: ActionContext<VQBState, any>, ...args: any[]) {
        context.commit('setLoading', { isLoading: true });
        await originalMethod(context, ...args);
        context.commit('setLoading', { isLoading: false });
      };
    } else {
      descriptor.value = async function(context: ActionContext<VQBState, any>, ...args: any[]) {
        context.commit('setUniqueValuesLoading', { isLoading: true, column: args[0].column });
        await originalMethod(context, ...args);
        context.commit('setUniqueValuesLoading', { isLoading: false, column: args[0].column });
      };
    }

    return descriptor;
  };
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

  @loading()
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

  /**
   * Call backend with a special pipeline to retrieve unique values of the requested column.
   * The current pipeline is completed with a "count aggregation" on the requested column.
   * The result is loaded in store.
   */
  @loading(true)
  async loadColumnUniqueValues(
    context: ActionContext<VQBState, any>,
    { column }: { column: string },
  ) {
    const activePipeline = context.getters.activePipeline;
    if (!activePipeline.length) {
      return;
    }
    const loadUniqueValuesPipeline: Pipeline = [
      ...activePipeline,
      {
        name: 'aggregate',
        aggregations: [
          {
            column,
            aggfunction: 'count',
            newcolumn: '__vqb_count__',
          },
        ],
        on: [column],
      },
    ];
    const response = await backendService.executePipeline(
      preparePipeline(loadUniqueValuesPipeline, context.state),
      10000, // FIXME: limit is hard-coded
      0,
    );
    if (!response.error) {
      context.commit('setDataset', {
        dataset: updateLocalUniquesFromDatabase(context.state.dataset, response.data),
      });
    }
  }
}

const actions: ActionTree<VQBState, any> = {};
Object.assign(actions, Actions.prototype);
export default actions;
