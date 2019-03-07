import Vue from 'vue';

import { storiesOf } from '@storybook/vue';

storiesOf('Sample stories', module)
  .add('story as a template', () => '<div>bouh</div>')

  .add('story as a component', () => ({
    components: {  },
    data() {
      return {
        text: 'vkjdsfjds'
      }
    },
    template: '<div>{{ text }}</div>'
  }));
