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
        :selectedVariables="selectedVariables"
        @input="input"/>
      <pre>{{ selectedVariables }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      selectedVariables: [],
    };
  },
  methods: {
    input(value) {
      this.selectedVariables = [value];
    },
  },
}));

stories.add('selected', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables"
        :selectedVariables="selectedVariables"
        @input="input"/>
      <pre>{{ selectedVariables }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      selectedVariables: ['requestersManager.country'],
    };
  },
  methods: {
    input(value) {
      this.selectedVariables = [value];
    },
  },
}));

stories.add('multiple', () => ({
  template: `
    <div>
      <VariableList 
        :available-variables="availableVariables"
        :selectedVariables="selectedVariables"
        :isMultiple="true"
        @input="input"/>
      <pre>{{ selectedVariables }}</pre>
    </div>
  `,

  components: {
    VariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      selectedVariables: [],
    };
  },
  methods: {
    input(value) {
      // toggle logic is handle by parent
      if (this.selectedVariables.indexOf(value) !== -1) {
        this.selectedVariables = this.selectedVariables.filter(v => v !== value);
      } else {
        this.selectedVariables = [...this.selectedVariables, value];
      }
    },
  },
}));
