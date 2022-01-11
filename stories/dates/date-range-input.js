import { DateRangeInput } from '../../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

import { withKnobs, boolean } from '@storybook/addon-knobs';

const stories = storiesOf('Dates/DateRangeInput', module);

stories.addDecorator(withKnobs);

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

const RELATIVE_SAMPLE_VARIABLES = [
  {
    label: 'Today',
    identifier: 'today',
  },
  {
    label: 'Last month',
    identifier: 'last_month',
  },
  {
    label: 'Last year',
    identifier: 'last_year',
  },
];

stories.add('simple', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: undefined,
      actualRangeValue: undefined,
    };
  },
}));

stories.add('already selected variable', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: '{{dates.all_time}}',
    };
  },
}));

stories.add('custom (fixed date range)', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: { start: new Date(1), end: new Date(100000000) },
    };
  },
}));

stories.add('custom (relative date)', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: { quantity: 1, duration: 'month', operator: 'until', date: '{{today}}' },
    };
  },
}));

stories.add('without relative date enabled', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        :enableRelativeDate="false"
        :enabledCalendars="['quarter', 'year']"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: undefined,
    };
  },
}));

stories.add('disable custom selection', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        :enableCustom="false"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: undefined,
      actualRangeValue: undefined,
    };
  },
}));

stories.add('custom (with bounds)', () => ({
  template: `
    <div>
      <DateRangeInput
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        :enableCustom="true"
        :bounds="bounds"
        v-model="value"
        @dateRangeValueUpdated="(v) => actualRangeValue = v"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
      value: { start: new Date('2021/2/1'), end: new Date('2021/2/5') },
      bounds: { start: new Date('2021/2/2'), end: new Date('2021/10/4') },
      actualRangeValue: undefined,
    };
  },
}));

stories.add('without any variable', () => ({
  template: `
    <div>
      <DateRangeInput v-model="value"/>
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      value: undefined,
    };
  },
}));

stories.add('always open (preview mode)', () => ({
  props: {
    compactMode: {
      default: boolean('Compact mode', false),
    },
    hidePlaceholder: {
      default: boolean('Hide placeholder', false),
    },
    coloredBackground: {
      default: boolean('Colored background', true),
    },
    enableCustom: {
      default: boolean('Enable custom', true),
    },
    enableVariables: {
      default: boolean('Enable variables', true),
    },
  },
  template: `
    <div>
      <DateRangeInput
        v-model="value"
        :enable-relative-date="true"
        :enable-custom="enableCustom"
        :alwaysOpened="true"
        :enabledCalendars="['day', 'week', 'month', 'quarter', 'year']"
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        :hidePlaceholder="hidePlaceholder"
        :coloredBackground="coloredBackground"
        :compactMode="compactMode"
      />
      <pre style="margin-top: 500px;">{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      value: undefined,
      actualRangeValue: undefined,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
    };
  },

  computed: {
    availableVariables() {
      return this.enableVariables ? SAMPLE_VARIABLES : [];
    },
  },
}));
stories.add('localized (fr)', () => ({
  template: `
    <div>
      <DateRangeInput
        v-model="value"
        :enable-relative-date="true"
        :enable-custom="true"
        :alwaysOpened="true"
        :enabledCalendars="['day', 'week', 'month', 'quarter', 'year']"
        :locale="'fr'"
      />
      <pre style="margin-top: 500px;">{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      value: undefined,
      actualRangeValue: undefined,
    };
  },
}));

stories.add('custom css variables', () => ({
  props: {
    coloredBackground: {
      default: boolean('Colored background', true),
    },
  },
  template: `
    <div>
      <DateRangeInput
        v-model="value"
        :enable-relative-date="true"
        :enable-custom="true"
        :alwaysOpened="true"
        :enabledCalendars="['day', 'week', 'month', 'quarter', 'year']"
        :themeCSSVariables="themeCSSVariables"
        :coloredBackground="coloredBackground"
      />
      <pre style="margin-top: 500px;">{{ value }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      value: undefined,
      actualRangeValue: undefined,
      themeCSSVariables: {
        '--weaverbird-theme-main-color-dark': '#000000',
        '--weaverbird-theme-main-color': '#61968A',
        '--weaverbird-theme-main-color-light': '#E4EFEC',
        '--weaverbird-theme-main-color-extra-light': '#F8F7FA',
        '--weaverbird-theme-emphasis-color': '#000',
        '--weaverbird-theme-emphasis-color-dark': '#000',
      },
    };
  },
}));

stories.add('compact mode', () => ({
  props: {
    hidePlaceholder: {
      default: boolean('Hide placeholder', true),
    },
    coloredBackground: {
      default: boolean('Colored background', true),
    },
  },
  template: `
    <div>
      <DateRangeInput
        v-model="value"
        :enable-relative-date="true"
        :enable-custom="true"
        :enabledCalendars="['day', 'week', 'month', 'quarter', 'year']"
        :available-variables="availableVariables"
        :relative-available-variables="relativeAvailableVariables"
        :variable-delimiters="variableDelimiters"
        :compactMode="true"
        :hidePlaceholder="hidePlaceholder"
        :coloredBackground="coloredBackground"
      />
      <pre>{{ value }}</pre>
      <pre>{{ actualRangeValue }}</pre>
    </div>
  `,

  components: {
    DateRangeInput,
  },

  data() {
    return {
      value: undefined,
      actualRangeValue: undefined,
      availableVariables: SAMPLE_VARIABLES,
      variableDelimiters: { start: '{{', end: '}}' },
      relativeAvailableVariables: RELATIVE_SAMPLE_VARIABLES,
    };
  },
}));
