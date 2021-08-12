import { VariableList } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Widgets/VariableList', module);

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

stories.add('simple', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables" 
        :selectedVariables="value"
        @input="input"/>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: '',
    };
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
}));

stories.add('selected', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables"
        :selectedVariables="value"
        @input="input"/>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: 'requestersManager.country',
    };
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
}));

stories.add('multiple', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables"
        :selectedVariables="value"
        :isMultiple="true"
        @input="input"/>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: [],
    };
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
}));

stories.add('with error type in multiple mode (should raise an exception)', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables"
        :selectedVariables="value"
        :isMultiple="true"
        @input="input"/>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: '',
    };
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
}));

stories.add('with error type in single mode (should raise an exception)', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables"
        :selectedVariables="value"
        :isMultiple="false"
        @input="input"/>
      <pre>{{ value }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      value: [],
    };
  },
  methods: {
    input(value) {
      this.value = value;
    },
  },
}));
