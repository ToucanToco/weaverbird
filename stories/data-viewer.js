import { storiesOf } from '@storybook/vue';

import { DataViewer } from '../dist/storybook/components';

const stories = storiesOf('DataViewer', module);

stories.add('empty', () => ({
  components: { DataViewer },
  template: `
    <data-viewer>
    </data-viewer>
  `,
}));

stories.add('simple', () => ({
  components: { DataViewer },
  props: {
    dataset: {
      default() {
        return [
          { columnA: 'value1', columnB: 'value2', columnC: 'value3' },
          { columnA: 'value4', columnB: 'value5', columnC: 'value6' },
          { columnA: 'value7', columnB: 'value8', columnC: 'value9' },
          { columnA: 'value10', columnB: 'value11', columnC: 'value12' },
          { columnA: 'value13', columnB: 'value14', columnC: 'value15' },
        ];
      },
    },
  },
  template: `
      <data-viewer
        :dataset="dataset"
      >
      </data-viewer>
    `,
}));
