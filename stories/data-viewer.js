import { storiesOf } from '@storybook/vue';
import Vuex from 'vuex';
import Vue from 'vue';

import { DataViewer, registerModule } from '../dist/storybook/components';

const stories = storiesOf('DataViewer', module);
Vue.use(Vuex)

stories.add('empty', () => ({
  store: new Vuex.Store({}),
  created: function() {
    registerModule(this.$store, {
      dataset: {
        headers:[],
        data: [],
        paginationContext: {
          pagesize: 50,
          pageno: 1,
          totalCount: 50,
        },
      },
      currentPipelineName: "test",
      pipelines: {test: []}
    })
  },
  components: { DataViewer },
  template: `
    <data-viewer>
    </data-viewer>
  `,
}));

stories.add('simple', () => ({
  store: new Vuex.Store({}),
  created: function() {
    registerModule(this.$store, {
      dataset: {
        headers:
          [
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
          pagesize: 50,
          pageno: 1,
          totalCount: 50,
        },
      },
      currentPipelineName: "test",
      pipelines: {test: []}
    });
  },
  components: { DataViewer },
  template: `
      <data-viewer>
      </data-viewer>
    `,
}));
