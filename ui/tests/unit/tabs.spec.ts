import { shallowMount, Wrapper } from '@vue/test-utils';

import Tabs from '../../src/components/Tabs.vue';

const TABS = ['Tab 1', 'Tab 2'];

describe('Tabs', () => {
  let wrapper: Wrapper<Tabs>;
  const createWrapper: Function = (propsData: any = {}) => {
    wrapper = shallowMount(Tabs, { propsData });
  };

  afterEach(() => {
    if (wrapper) wrapper.destroy();
  });

  describe('empty', () => {
    beforeEach(() => {
      createWrapper();
    });
    it('should set tabs to empty array by default', () => {
      expect((wrapper.vm as any).tabs).toStrictEqual([]);
    });
    it('should set disabled tabs to empty array by default', () => {
      expect((wrapper.vm as any).disabledTabs).toStrictEqual([]);
    });
  });

  describe('(default case)', () => {
    beforeEach(() => {
      createWrapper({
        tabs: TABS,
        selectedTab: 'Tab 2',
        disabledTabs: [],
      });
    });
    it('should instantiate', () => {
      expect(wrapper.exists()).toBe(true);
    });
    it('should display the tabs', () => {
      expect(wrapper.findAll('.tabs__tab').wrappers.map((wrapper: any) => wrapper.text())).toEqual(
        TABS,
      );
    });
    it('should select the right tab', () => {
      expect(wrapper.find('.tabs__tab--selected').text()).toBe('Tab 2');
    });
  });

  describe('error on init selected tab', () => {
    describe('no selected tab', () => {
      beforeEach(() => {
        createWrapper({
          tabs: TABS,
          selectedTab: undefined,
          disabledTabs: [],
        });
      });
      it('should select the first available tab', () => {
        expect(wrapper.emitted().tabSelected[0][0]).toStrictEqual('Tab 1');
      });
    });

    describe('disabled tab', () => {
      beforeEach(() => {
        createWrapper({
          tabs: TABS,
          selectedTab: 'Tab 1',
          disabledTabs: ['Tab 1'],
        });
      });
      it('should select the first available tab', () => {
        expect(wrapper.emitted().tabSelected[0][0]).toStrictEqual('Tab 2');
      });
    });

    describe('inexisting tab', () => {
      beforeEach(() => {
        createWrapper({
          tabs: TABS,
          selectedTab: 'nop',
          disabledTabs: [],
        });
      });
      it('should select the first available tab', () => {
        expect(wrapper.emitted().tabSelected[0][0]).toStrictEqual('Tab 1');
      });
    });
  });

  describe('with specific format', () => {
    beforeEach(() => {
      createWrapper({
        tabs: TABS,
        selectedTab: undefined,
        disabledTabs: [],
        formatTab: (tab: string) => `${tab} YOLO`,
      });
    });
    it('should display the formatted tabs', () => {
      expect(wrapper.findAll('.tabs__tab').wrappers.map((wrapper: any) => wrapper.text())).toEqual(
        TABS.map(tab => `${tab} YOLO`),
      );
    });
  });

  describe('when selecting a tab', () => {
    beforeEach(() => {
      createWrapper({
        tabs: TABS,
        selectedTab: 'Tab 2',
        disabledTabs: [],
      });
    });
    it('should emit the selected tab', async () => {
      wrapper.find('.tabs__tab').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted().tabSelected[0][0]).toStrictEqual('Tab 1');
    });
  });

  describe('when tab is disabled', () => {
    beforeEach(async () => {
      createWrapper({
        tabs: TABS,
        disabledTabs: ['Tab 2'],
        selectedTab: 'Tab 1',
      });
      await wrapper.vm.$nextTick();
    });

    it('should disable the selected tab', () => {
      expect(wrapper.find('.tabs__tab--disabled').text()).toBe('Tab 2');
    });

    it('should not emit event when clicking on disabled tab', async () => {
      wrapper.find('.tabs__tab--disabled').trigger('click');
      await wrapper.vm.$nextTick();
      expect(wrapper.emitted('tabSelected')).toBeUndefined();
    });
  });
});
