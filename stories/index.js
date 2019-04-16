import { Step, ResizablePanels } from '../dist/storybook/components';
import '../dist/vue-query-builder.css';

import { withKnobs, text, boolean } from '@storybook/addon-knobs';

import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Step', module);

stories.addDecorator(withKnobs)
  .add('default', () => ({
    components: { Step },
    props: {
      step: { default: {
        name: text('Step name', 'Default step name')
      }}
    },
    template: '<step :step="step"></step>'
  }))

  .add('first', () => ({
    components: { Step },
    data() {
      return {
        step: {
          name: "Sample step"
        }
      }
    },
    template: '<step is-first :step="step"></step>'
  }))

  .add('last', () => ({
    components: { Step },
    data() {
      return {
        step: {
          name: "Sample step"
        }
      }
    },
    template: '<step is-last :step="step"></step>'
  }));


const storiesResizablePanels = storiesOf('ResizablePanels', module);

storiesResizablePanels
  .add('default', () => ({
    components: { ResizablePanels },
    template: '<resizable-panels style="height: 600px;"></resizable-panels>'
  }));
