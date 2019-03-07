import Step from '../src/components/Step.vue';

import { storiesOf } from '@storybook/vue';

storiesOf('Step', module)

  .add('default', () => ({
    components: { Step },
    data() {
      return {
        step: {
          name: "Sample step"
        }
      }
    },
    template: '<step :step="step"></step>'
  }));
