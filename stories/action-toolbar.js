import { ActionToolbar } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('ActionToolbar', module);

stories.add('Add Column 2', () => ({
  components: { ActionToolbar },
  data() {
    return {
      actionType: "yolo",
    };
  },
  template: '<action-toolbar :actionType="actionType"></action-toolbar>',
}));
