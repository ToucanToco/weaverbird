import { VariableInput, MultiInputText } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Inputs with variables', module);

const SAMPLE_VARIABLES = [
  {
    category: 'App variables',
    label: 'view',
    identifier: 'appRequesters.view',
    value: 'Product 123',
  },
  {
    category: 'App variables',
    label: 'date.month',
    identifier: 'appRequesters.date.month',
    value: 'Apr',
  },
  {
    category: 'App variables',
    label: 'date.year',
    identifier: 'appRequesters.date.year',
    value: '2020',
  },
  {
    category: 'Story variables',
    label: 'country',
    identifier: 'requestersManager.country',
    value: '2020',
  },
  {
    category: 'Story variables',
    label: 'city',
    identifier: 'appRequesters.city',
    value: 'New York',
  },
];

stories.add('wrapping a text input', () => ({
  template: `
    <div>
      <VariableInput v-model="value" :available-variables="availableVariables">
        <input type="text" v-model="value" />
      </VariableInput>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    VariableInput
  },

  data() {
    return {
      value: undefined,
      availableVariables: SAMPLE_VARIABLES
    };
  },
}));

stories.add('wrapping a MultiInputText', () => ({
  template: `
    <div>
      <VariableInput v-model="value" :available-variables="availableVariables">
        <MultiInputText v-model="value"></MultiInputText>
      </VariableInput>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    MultiInputText,
    VariableInput,
  },

  data() {
    return {
      value: undefined,
      availableVariables: SAMPLE_VARIABLES
    };
  },
}));

