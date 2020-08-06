import Vue from 'vue';
import { Autocomplete, VariableInput, MultiInputText, InputText, List } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

import VTooltip from 'v-tooltip';

Vue.use(VTooltip);

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
    VariableInput,
  },

  data() {
    return {
      value: undefined,
      availableVariables: SAMPLE_VARIABLES,
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
      availableVariables: SAMPLE_VARIABLES,
    };
  },
}));

stories.add('wrapping a Autocomplete', () => ({
  template: `
    <div>
      <Autocomplete v-model="value" :available-variables="availableVariables" :options="options"></Autocomplete>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    MultiInputText,
    Autocomplete,
  },

  data() {
    return {
      value: undefined,
      options: ['foo', 'bar', 'helloworld'],
      availableVariables: SAMPLE_VARIABLES,
    };
  },
}));

stories.add('wrapping a List', () => ({
  template: `
    <div>
      <List
        addFieldName="Add Column"
        name="Columns:"
        v-model="value"
        :widget="widget"
        :available-variables="availableVariables"
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
      availableVariables: SAMPLE_VARIABLES,
    };
  },
}));
