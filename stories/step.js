import { Step, registerModule } from '../dist/storybook/components';

import { withKnobs, text } from '@storybook/addon-knobs';

import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Step', module);

import Vue from 'vue';
import Vuex from 'vuex';
Vue.use(Vuex);

stories
  .addDecorator(withKnobs)
  .add('default', () => ({
    components: {
      Step,
    },
    props: {
      step: {
        default: {
          name: text('Step name', 'custom'),
        },
      },
    },
    template: '<step :step="step"></step>',
    store: new Vuex.Store(),
    created: function() {
      registerModule(this.$store, {
        backendMessages: [],
        dataset: { headers: [], data: [] },
      });
    },
  }))

  .add('first', () => ({
    components: {
      Step,
    },
    data() {
      return {
        step: {
          name: 'custom',
        },
      };
    },
    template: '<step is-first :step="step"></step>',
    store: new Vuex.Store(),
    created: function() {
      registerModule(this.$store, {
        backendMessages: [],
        dataset: { headers: [], data: [] },
      });
    },
  }))

  .add('last', () => ({
    components: {
      Step,
    },
    data() {
      return {
        step: {
          name: 'custom',
        },
      };
    },
    template: '<step is-last :step="step"></step>',
    store: new Vuex.Store(),
    created: function() {
      registerModule(this.$store, {
        backendMessages: [],
        dataset: { headers: [], data: [] },
      });
    },
  }))

  .add('error', () => ({
    components: {
      Step,
    },
    data() {
      return {
        step: {
          name: 'custom',
        },
      };
    },
    template: '<step :indexInPipeline="2" :step="step"></step>',
    store: new Vuex.Store(),
    created: function() {
      registerModule(this.$store, {
        backendMessages: [{ index: 2, message: 'I am an error', type: 'error' }],
        dataset: { headers: [], data: [] },
      });
    },
  }));
