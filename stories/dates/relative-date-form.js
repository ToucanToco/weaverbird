import { RelativeDateForm } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/RelativeDateForm', module);

stories.add('simple', () => ({
  template: `
    <div>
      <RelativeDateForm v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateForm,
  },

  data() {
    return {
      value: { quantity: -3, duration: 'month' },
    };
  },
}));

stories.add('empty', () => ({
  template: `
    <div>
      <RelativeDateForm v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateForm,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));