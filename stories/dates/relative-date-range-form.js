import { RelativeDateRangeForm } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/RelativeDateRangeForm', module);

stories.add('simple', () => ({
  template: `
    <div>
      <RelativeDateRangeForm />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    RelativeDateRangeForm,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));
