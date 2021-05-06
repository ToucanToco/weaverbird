import { storiesOf } from '@storybook/vue';

import { Popover } from '../dist/storybook/components';

const stories = storiesOf('Popover', module);

stories.add('simple', () => ({
  components: { Popover },
  data() {
    return { visible: false};
  },
  template: `
    <div>
      <button @click="visible = !visible">Toggle popover</button>
      <Popover :visible="visible">
        Some content!
      </Popover>
    </div>
  `,
}));

// An example on how to customize popover's container
stories.add('with specific item as container', () => ({
  beforeCreate() {
    const container = document.createElement('div');
    container.classList.add('alternate-root');
    document.body.appendChild(container);
  },
  provide() {
    return {
      weaverbirdPopoverContainer: document.querySelector('.alternate-root')
    };
  },
  components: { Popover },
  data() {
    return { visible: false };
  },
  template: `
    <div>
      <button @click="visible = !visible">Toggle popover</button>
      <Popover :visible="visible">
        Some content!
      </Popover>
    </div>
  `,
}));
