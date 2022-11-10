import { Multiselect } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Widgets/Multiselect', module);

stories.add('simple', () => ({
  template: `
    <div>
      <Multiselect
      v-model="value"
      :options="options"
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    Multiselect
  },

  data()
  {
    return {
      value: undefined,
      options: ['a', 'b', 'c']
    }
  },
}));
