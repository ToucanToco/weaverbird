import Vue from 'vue';
import {
  Autocomplete,
  VariableInput,
  MultiInputText,
  InputNumber,
  InputText,
  List,
  Multiselect,
} from '../dist/storybook/components';
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

stories.add('wrapping a MultiInputText with multi variable', () => ({
  template: `
    <div>
    <MultiInputText 
      v-model="value" 
      :available-variables="availableVariables"
      :multiVariable="true"
      :variableDelimiters="variableDelimiters" />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    MultiInputText,
  },

  data() {
    return {
      value: undefined,
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
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

stories.add('wrapping a Multiselect with multi variables', () => ({
  template: `
    <div>
      <Multiselect 
        v-model="value" 
        :available-variables="availableVariables"
        :variableDelimiters="variableDelimiters"
        :options="options"
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: { Multiselect },

  data() {
    return {
      value: undefined,
      options: ['foo', 'bar', 'helloworld'],
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
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
  `,

  components: {
    InputText,
    List,
  },

  data() {
    return {
      value: undefined,
      widget: InputText,
      availableVariables: SAMPLE_VARIABLES,
    };
  },
}));

stories.add('wrapping a InputNumber', () => ({
  template: `
    <div>
      <InputNumber v-model="value" :available-variables="availableVariables"></InputNumber>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    InputNumber,
  },

  data() {
    return {
      value: undefined,
      availableVariables: SAMPLE_VARIABLES,
    };
  },
}));

stories.add('wrapping a widget with advanced variable', () => ({
  template: `
    <div>
      <Multiselect 
        v-model="value" 
        :available-variables="availableVariables"
        :variableDelimiters="variableDelimiters"
        :use-advanced-variable="useAdvancedVariable"
        :options="options"
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: { Multiselect },

  data() {
    return {
      value: undefined,
      options: ['foo', 'bar', 'helloworld'],
      useAdvancedVariable: true,
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
    };
  },
}));

stories.add('wrapping a widget with advanced variable and no variables', () => ({
  template: `
    <div>
      <Multiselect 
        v-model="value" 
        :variableDelimiters="variableDelimiters"
        :use-advanced-variable="useAdvancedVariable"
        :options="options"
      />
      <pre>{{ value }}</pre>
    </div>
  `,

  components: { Multiselect },

  data() {
    return {
      value: undefined,
      options: ['foo', 'bar', 'helloworld'],
      useAdvancedVariable: true,
      variableDelimiters: { start: '{{', end: '}}' },
    };
  },
}));