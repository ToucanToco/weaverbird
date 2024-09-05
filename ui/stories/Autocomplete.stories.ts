import type { Meta, StoryFn, StoryObj } from '@storybook/vue';
import { action } from '@storybook/addon-actions';

import Autocomplete from '@/components/stepforms/widgets/Autocomplete.vue';

export default {
  component: Autocomplete,
  render: (args, { argTypes }) => ({
    props: Object.keys(argTypes),

    components: {
      Autocomplete,
    },

    template: `
      <Autocomplete
        v-bind="$props"
        @input="onInput"
      />
    `,

    methods: {
      onInput: action('input'),
    },
  }),

  args: {
    options: ['label', 'value'],
  },
} as Meta<typeof Autocomplete>;

export const Default: StoryObj<typeof Autocomplete> = {};

export const AllowCustom: StoryObj<typeof Autocomplete> = {
  args: {
    allowCustom: true,
  },
};

export const CustomValue: StoryObj<typeof Autocomplete> = {
  args: {
    value: 'other',
    allowCustom: true,
  },
};
