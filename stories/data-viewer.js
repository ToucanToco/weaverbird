import { storiesOf } from '@storybook/vue';

import { DataViewer, setupStore } from '../dist/storybook/components';
const stories = storiesOf('DataViewer', module);

stories.add('empty', () => ({
  store: setupStore({}, [], true),
  components: { DataViewer },
  template: `
    <data-viewer>
    </data-viewer>
  `,
}));

stories.add('simple', () => ({
  store: setupStore({
    dataset: {
      headers:
        [
          { name: 'columnA' },
          { name: 'columnB' },
          { name: 'columnC' },
        ],
      data: [
        ['value1', 'value2', 'value3'],
        ['value4', 'value5', 'value6'],
        ['value7', 'value8', 'value9'],
        ['value10', 'value11', 'value12'],
        ['value10', { obj: 'value14' }, null],
      ]
    },
  }, [], true),
  components: { DataViewer },
  template: `
      <data-viewer
        :dataset="dataset"
      >
      </data-viewer>
    `,
}));
