import { NewDateInput } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/NewDateInput', module);

stories.add('simple', () => ({
  template: `
    <div>
      <NewDateInput />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    NewDateInput,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));