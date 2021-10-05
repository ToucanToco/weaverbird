import { storiesOf } from '@storybook/vue';

import { MonthCalendar } from '../../dist/storybook/components';

const stories = storiesOf('Dates/MonthCalendar', module);

stories.add('simple', () => ({
  components: { MonthCalendar },
  template: `
  <div>
    <MonthCalendar/>
  </div>
  `,
}));
