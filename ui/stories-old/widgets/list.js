import { List, InputText } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Widgets/List', module);

stories.add('simple', () => ({
  template: `
    <div>
      <List
        addFieldName="Add Column"
        name="Columns :"
        v-model="value"
        :widget="widget"
        :automatic-new-field="false"
        defaultItem=""
      ></List>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    List,
    InputText,
  },

  data() {
    return {
      value: undefined,
      widget: InputText,
    };
  },
}));

stories.add('automatic add new field', () => ({
  template: `
    <div>
      <List
        addFieldName="Add Column"
        name="Columns :"
        v-model="value"
        :widget="widget"
        defaultItem=""
      ></List>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    List,
    InputText,
  },

  data() {
    return {
      value: undefined,
      widget: InputText,
    };
  },
}));