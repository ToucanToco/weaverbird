import type { Meta, StoryFn } from '@storybook/vue';
import Vuex from 'vuex';

import DataViewer from '@/components/DataViewer.vue';
import { resizable } from '@/directives/resizable/resizable';
import { registerModule } from '@/store';

export default {
  component: DataViewer,
} as Meta<typeof DataViewer>;

export const Empty: StoryFn<typeof DataViewer> = () => ({
  store: new Vuex.Store({}),
  created: function () {
    registerModule(this.$store, {
      dataset: {
        headers: [],
        data: [],
        paginationContext: {
          shouldPaginate: false,
          pageSize: 50,
          pageNumber: 1,
          totalCount: 50,
          isLastPage: true,
        },
      },
      currentPipelineName: 'test',
      pipelines: { test: [] },
    });
  },
  components: { DataViewer },
  // directives: { resizable },
  template: `
    <DataViewer />
  `,
});

export const Loading: StoryFn<typeof DataViewer> = () => ({
  store: new Vuex.Store({}),
  created: function () {
    registerModule(this.$store, {
      isLoading: {
        dataset: true,
        uniqueValues: false,
      },
      dataset: {
        headers: [],
        data: [],
        paginationContext: {
          shouldPaginate: false,
          pageSize: 50,
          pageNumber: 1,
          totalCount: 50,
          isLastPage: true,
        },
      },
      currentPipelineName: 'test',
      pipelines: { test: [] },
    });
  },
  components: { DataViewer },
  directives: { resizable },
  template: `
    <DataViewer />
  `,
});

export const Simple: StoryFn<typeof DataViewer> = () => ({
  store: new Vuex.Store({}),
  created: function () {
    registerModule(this.$store, {
      dataset: {
        headers: [
          { name: 'columnA', type: 'string' },
          { name: 'columnB', type: 'date' },
          { name: 'columnC', type: 'integer' },
        ],
        data: [
          ['value1', 'value2', 'value3'],
          ['value4', 'value5', 'value6'],
          ['value7', 'value8', 'value9'],
          ['value10', 'value11', 'value12'],
          ['value10', { obj: 'value14' }, null],
        ],
        paginationContext: {
          shouldPaginate: false,
          pageSize: 50,
          pageNumber: 1,
          totalCount: 50,
          isLastPage: true,
        },
      },
      currentPipelineName: 'test',
      pipelines: { test: [] },
    });
  },
  components: { DataViewer },
  directives: { resizable },
  template: `
    <DataViewer />
  `,
});
