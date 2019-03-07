import Step from '../src/components/Step.vue';
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
    template: '<step isFirst :step="step"></step>'
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
    template: '<step isLast :step="step"></step>'
  }));
