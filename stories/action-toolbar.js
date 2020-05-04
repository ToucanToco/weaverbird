import { storiesOf } from '@storybook/vue';
import Vue from 'vue';
import Vuex from 'vuex';

import { ActionToolbar, registerModule } from '../dist/storybook/components';

const stories = storiesOf('ActionToolbar', module);
Vue.use(Vuex)

stories.add('for mongo40', () => ({
  store: new Vuex.Store({}),
  created: function() {
    registerModule(this.$store, {
      translator: "mongo40",
    })
  },
  components: { ActionToolbar },
  template: `
    <ActionToolbar>
    </ActionToolbar>
  `,
}));

stories.add('for mongo36', () => ({
  store: new Vuex.Store({}),
  created: function() {
    registerModule(this.$store, {
      translator: "mongo36",
    })
  },
  components: { ActionToolbar },
  template: `
    <ActionToolbar>
    </ActionToolbar>
  `,
}));
