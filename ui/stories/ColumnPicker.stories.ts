import type { Meta, StoryFn } from '@storybook/vue';
import { action } from '@storybook/addon-actions';
import { createPinia, PiniaVuePlugin } from 'pinia';
import Vue from 'vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';
import { setupVQBStore } from '@/store';

Vue.use(PiniaVuePlugin);

export default {
  component: ColumnPicker,
} as Meta<typeof ColumnPicker>;

export const Empty: StoryFn<typeof ColumnPicker> = () => ({
  pinia: createPinia(),

  components: {
    ColumnPicker,
  },

  template: `
    <ColumnPicker
      v-bind="$props"
      @input="onInput"
    />
  `,

  created: function () {
    setupVQBStore({
      backendMessages: [],
      dataset: { headers: [{ name: 'label' }, { name: 'value' }], data: [] },
    });
  },

  methods: {
    onInput: action('input'),
  },
});
