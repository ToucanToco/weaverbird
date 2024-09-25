import type { Meta, StoryObj } from '@storybook/vue';

import ColumnPicker from '@/components/stepforms/ColumnPicker.vue';

export default {
  component: ColumnPicker,
} as Meta<ColumnPicker>;

export const Default: StoryObj<ColumnPicker> = {
  render: (args, { argTypes }) => ({
    components: { ColumnPicker },
    props: Object.keys(argTypes),
    template: `<ColumnPicker 
      v-bind="$props" 
      :value="value" 
      :selectedColumns="selectedColumns" 
      @input="onInput"
      @setSelectedColumns="onSetSelectedColumns"
    />`,
    data(): { value?: string; selectedColumns: string[] } {
      return {
        value: undefined,
        selectedColumns: [],
      };
    },
    methods: {
      onInput(value) {
        this.value = value;
      },
      onSetSelectedColumns({ column }) {
        this.selectedColumns = [column];
      },
    },
  }),
  args: {
    columnNames: ['label', 'value'],
  },
};
