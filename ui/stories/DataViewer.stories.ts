import type { Meta, StoryFn } from '@storybook/vue';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import DataViewer from '@/components/DataViewer.vue';
import { resizable } from '@/directives/resizable/resizable';
import { setupVQBStore } from '@/store';

export default {
  component: DataViewer,
} as Meta<typeof DataViewer>;

Vue.use(PiniaVuePlugin);

export const Empty: StoryFn<typeof DataViewer> = () => ({
  created: function () {
    setupVQBStore({
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
  pinia: createPinia(),
  components: { DataViewer },
  // directives: { resizable },
  template: `
    <DataViewer />
  `,
});

export const Loading: StoryFn<typeof DataViewer> = () => ({
  created: function () {
    setupVQBStore({
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
  pinia: createPinia(),
  components: { DataViewer },
  directives: { resizable },
  template: `
    <DataViewer />
  `,
});

export const Simple: StoryFn<typeof DataViewer> = () => ({
  created: function () {
    setupVQBStore({
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
  pinia: createPinia(),
  components: { DataViewer },
  directives: { resizable },
  template: `
    <DataViewer />
  `,
});

export const Connector: StoryFn<typeof DataViewer> = () => ({
  created: function () {
    setupVQBStore({
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
      translator: 'athena',
      currentPipelineName: 'test',
      pipelines: { test: [] },
    });
  },
  pinia: createPinia(),
  components: { DataViewer },
  directives: { resizable },
  template: `
    <DataViewer />
  `,
});
