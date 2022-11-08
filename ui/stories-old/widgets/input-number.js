import { InputNumber } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Widgets/InputNumber', module);

stories.add('simple', () => ({
  template: `
    <div>
      <InputNumber v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    InputNumber,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));
