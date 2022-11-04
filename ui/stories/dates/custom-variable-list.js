import { CustomVariableList } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Dates/CustomVariableList', module);

const SAMPLE_VARIABLES = [
  {
    identifier: 'dates.last_7_days',
    label: 'Last 7 days',
  },
  {
    identifier: 'dates.last_14_days',
    label: 'Last 14 days',
  },
  {
    identifier: 'dates.last_30_days',
    label: 'Last 30 days',
  },
  {
    identifier: 'dates.last_3_months',
    label: 'Last 3 Months',
  },
  {
    identifier: 'dates.last_12_months',
    label: 'Last 12 Months',
  },
  {
    identifier: 'dates.month_to_date',
    label: 'Month to date',
  },
  {
    identifier: 'dates.quarter_to_date',
    label: 'Quarter to date',
  },
  {
    identifier: 'dates.all_time',
    label: 'All time',
  },
];

stories.add('simple', () => ({
  template: `
    <div>
      <CustomVariableList
        :available-variables="availableVariables" 
        :selectedVariables="selectedVariables"
        @input="input"
        @selectCustomVariable="selectCustomVariable"/>
      <pre>{{ selectedVariables }}</pre>
    </div>
  `,

  components: {
    CustomVariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      selectedVariables: '',
    };
  },
  methods: {
    input(value) {
      this.selectedVariables = value;
    },
    selectCustomVariable() {
      this.selectedVariables = 'custom';
    }
  },
}));

stories.add('disable custom selection', () => ({
  template: `
    <div>
      <CustomVariableList
        :available-variables="availableVariables" 
        :selectedVariables="selectedVariables"
        :enableCustom="false"
        @input="input"
        @selectCustomVariable="selectCustomVariable"/>
      <pre>{{ selectedVariables }}</pre>
    </div>
  `,

  components: {
    CustomVariableList,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      selectedVariables: '',
    };
  },
  methods: {
    input(value) {
      this.selectedVariables = value;
    },
    selectCustomVariable() {
      this.selectedVariables = 'custom';
    }
  },
}));