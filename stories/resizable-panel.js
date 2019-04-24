import { ResizablePanels } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('ResizablePanels', module);

stories.add('default', () => ({
  components: { ResizablePanels },
  template: '<resizable-panels style="height: 600px;"></resizable-panels>',
}));
