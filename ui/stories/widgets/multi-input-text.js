import { MultiInputText } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Widgets/MultiInputText', module);

stories.add('simple', () => ({
  template: `
    <div>
      <MultiInputText v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    MultiInputText
  },

  data()
  {
    return {
      value: undefined,
    }
  },
}));
