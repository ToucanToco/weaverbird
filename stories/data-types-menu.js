import { storiesOf } from '@storybook/vue';

import { DataTypesMenu } from '../dist/storybook/components';

const stories = storiesOf('DataTypesMenu', module);

stories.add('DataTypesMenu', () => ({
  components: { DataTypesMenu },
  template: `
    <DataTypesMenu>
    </DataTypesMenu>
  `,
}));
