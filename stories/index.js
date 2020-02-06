import {
  Step
} from '../dist/storybook/components';
import '../dist/weaverbird.css';

import {
  withKnobs,
  text
} from '@storybook/addon-knobs';

import {
  storiesOf
} from '@storybook/vue';

const stories = storiesOf('Step', module);

stories
  .addDecorator(withKnobs)
  .add('default', () => ({
    components: {
      Step
    },
    props: {
      step: {
        default: {
          name: text('Step name', 'Default step name'),
        },
      },
    },
    template: '<step :step="step"></step>',
  }))

  .add('first', () => ({
    components: {
      Step
    },
    data() {
      return {
        step: {
          name: 'Sample step',
        },
      };
    },
    template: '<step is-first :step="step"></step>',
  }))

  .add('last', () => ({
    components: {
      Step
    },
    data() {
      return {
        step: {
          name: 'Sample step',
        },
      };
    },
    template: '<step is-last :step="step"></step>',
  }));

import './data-viewer';
import './form-rename-step';
import './resizable-panel';
import './conditions-editor';
