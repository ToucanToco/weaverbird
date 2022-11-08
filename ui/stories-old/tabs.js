import { array, withKnobs } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/vue';

import { Tabs } from '../dist/storybook/components';

const stories = storiesOf('Tabs', module);

stories.addDecorator(withKnobs);

stories
.addDecorator(withKnobs)
.add('default', () => {
  return {
    components: { Tabs },
    props: {
      tabs: {
        default: array('tabs', ['tab1', 'tab2', 'tab3']),
      },
    },
    data() {
      return {
        selectedTab: undefined,
      };
    },
    methods: {
      selectTab(d) {
        this.selectedTab = d;
      },
    },
    template: `
      <div>
        <Tabs
          :tabs="tabs"
          :selectedTab="selectedTab"
          @tabSelected="selectTab"
        />
        <pre>{{ selectedTab }} content</pre>
      </div>
    `,
  };
})
.add('with custom formatting', () => {
  return {
    components: { Tabs },
    props: {
      tabs: {
        default: array('tabs', ['tab1', 'tab2', 'tab3']),
      },
    },
    data() {
      return {
        selectedTab: undefined,
      };
    },
    methods: {
      formatTab(tabKey) {
        return `My tab ${tabKey}`;
      },
      selectTab(d) {
        this.selectedTab = d;
      },
    },
    template: `
      <div>
        <Tabs
          :tabs="tabs"
          :selectedTab="selectedTab"
          :formatTab="formatTab"
          @tabSelected="selectTab"
        />
        <pre>{{ selectedTab }} content</pre>
      </div>
    `,
  };
})
.add('with disabled tabs', () => {
  return {
    components: { Tabs },
    props: {
      tabs: {
        default: array('tabs', ['tab1', 'tab2', 'tab3']),
      },
    },
    data() {
      return {
        selectedTab: 'tab1',
        disabledTabs: ['tab2'],
      };
    },
    methods: {
      selectTab(d) {
        this.selectedTab = d;
      },
    },
    template: `
      <div>
        <Tabs
          :tabs="tabs"
          :selectedTab="selectedTab"
          :disabledTabs="disabledTabs"
          @tabSelected="selectTab"
        />
        <pre>{{ selectedTab }} content</pre>
      </div>
    `,
  };
});
