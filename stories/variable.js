import { VariableInput, MultiInputText } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Inputs with variables', module);

const SAMPLE_VARIABLES = [
  {
    name: 'App variables',
    variables: [
      { name: 'view', value: 'Product 123' },
      { name: 'date.month', value: 'Apr' },
      { name: 'date.year', value: '2020' },
    ],
  },
  {
    name: 'Story variables',
    variables: [
      { name: 'country', value: 'USA' },
      { name: 'city', value: 'New york' },
    ],
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

