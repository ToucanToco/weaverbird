import { InputText } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Widgets/InputText', module);

stories.add('simple', () => ({
  template: `
    <div>
      <InputText v-model="value" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    InputText
  },

  data()
  {
    return {
      value: undefined,
    }
  },
}));
