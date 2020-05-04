import { Menu, MenuOption } from '../dist/storybook/components';
import { storiesOf } from '@storybook/vue';

const stories = storiesOf('Menu', module);

stories.add('with dummy content', () => ({
  components: {
    Menu
  },

  template: `
    <Menu visible>
      This is the basic menu container<br>
      <hr>
      With some content
    </Menu>
  `,
}));

stories.add('with some options', () => ({
  components: {
    Menu,
    MenuOption
  },

  template: `
    <Menu visible>
      <MenuOption>Ready</MenuOption>
      <MenuOption>Set</MenuOption>
      <MenuOption>Action</MenuOption>
    </Menu>
  `,
}));
