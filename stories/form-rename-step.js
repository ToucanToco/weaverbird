import {
  storiesOf
} from '@storybook/vue';

import {
  RenameStepForm,
  setupStore
} from '../dist/storybook/components';

const stories = storiesOf('RenameStepForm', module);

stories.add('simple', () => ({
  components: {
    RenameStepForm
  },
  store: setupStore({
    dataset: {
      headers: [{
        name: 'columnA'
      }, {
        name: 'columnB'
      }, {
        name: 'columnC'
      }],
      data: [
        ['value1', 'value2', 'value3'],
        ['value4', 'value5', 'value6'],
        ['value7', 'value8', 'value9'],
        ['value10', 'value11', 'value12'],
        ['value13', 'value14', 'value15'],
      ],
    },
  }, [], true),
  template: `
      <RenameStepForm>
      </RenameStepForm>
    `,
}));
